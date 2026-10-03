/** Benchmark: JSON checkpoint serializer vs the JS-source emitter. */
import toJs from '#io/utils.js'
import testPerformances from './testPerformances.js'

// ---- size knobs (mid-size checkpoint by default) ----
const STEPS = 10
const LENGTH_BUCKETS = 60
const HIST_KEYS = 60
const POOL = 6

// ---- seeded rng ----
let seed = 0x51ed2ab9

/**
 * Deterministic pseudo-random number in [0, 1].
 *
 * @returns {number}
 */
const rnd = () => ((seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff) / 0x7fffffff)

/**
 * @param {number} n
 * @returns {number} random integer in [0, n)
 */
const int = n => Math.floor(rnd() * n)

/**
 * @param {number} n
 * @returns {bigint} random `n`-digit number
 */
const bigDigits = n => {
    let v = 0n
    for (let i = 0; i < n; i++) v = v * 10n + BigInt(int(10))
    return v
}

/**
 * @param {number} keys
 * @returns {Object<string, number>} random histogram
 */
const hist = keys => {
    const h = {}
    for (let i = 0; i < keys; i++) h[1 + int(keys * 3)] = 1 + int(50)
    return h
}

/** @returns {FoundSnapshot} random snapshot */
const snapshot = () => ({
    additionSum: BigInt(int(9999)),
    multiplySum: BigInt(int(1 << 30)),
    numberValue: bigDigits(40 + int(400)),
})

/**
 * @param {number} step
 * @returns {TypeStep} random step bucket
 */
const stepBucket = step => ({
    additionSum: BigInt(int(1 << 30)),
    additionSums: hist(HIST_KEYS),
    atRunTime: int(1e9),
    combinations: bigDigits(20),
    count: 1 + int(1e6),
    first: snapshot(),
    iteration: BigInt(int(1e9)),
    last: snapshot(),
    multiplySum: BigInt(int(1 << 30)),
    productLengths: hist(HIST_KEYS),
    step,
})

/** @returns {LengthStepBucket} random per-length step bucket */
const lengthStepBucket = () => ({
    additionSum: BigInt(int(1 << 30)),
    additionSums: hist(HIST_KEYS),
    combinations: bigDigits(20),
    count: 1 + int(1e6),
    first: snapshot(),
    last: snapshot(),
    multiplySum: BigInt(int(1 << 30)),
    productLengths: hist(HIST_KEYS),
})

/** @returns {ComputationState} random checkpoint state */
const makeState = () => {
    const steps = []
    for (let s = 0; s < STEPS; s++) steps.push(rnd() < 0.2 ? null : stepBucket(s))

    const number_lengths = {}
    for (let i = 0; i < LENGTH_BUCKETS; i++) {
        const stepsObj = {}
        const k = 1 + int(3)
        for (let j = 0; j < k; j++) stepsObj[3 + j] = lengthStepBucket()
        number_lengths[2 + i] = { found: 1 + int(1e6), steps: stepsObj, time: int(1e9) }
    }

    return {
        iterations: {
            actual: bigDigits(18),
            count: int(2e9),
            found_nothing: int(1e6),
            found_nothing_break_at: 1_000_000_000,
        },
        last_number: bigDigits(60 + int(500)),
        number_lengths,
        pseudoGoal: bigDigits(60 + int(500)),
        range_start: 0n,
        steps,
        up_time: int(1e9),
    }
}
/** @type {ComputationState[]} */
const pool = Array.from({ length: POOL }, makeState)

// ---- fn_0: current serializer (copied from Config/computationStateIO.js) ----
/**
 * Old JSON replacer: productLengths as sorted rows, BigInt and HugeInt as strings.
 *
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
const replacer = (key, value) => {
    if (key === 'productLengths' && value && !Array.isArray(value)) {
        return Object.entries(value)
            .map(([productLength, count]) => ({ count, productLength: Number(productLength) }))
            .sort((a, b) => a.productLength - b.productLength)
    }
    const name = value?.constructor?.name
    if (name === 'BigInt') return value.toString()
    if (name === 'HugeInt' || name === 'HugeIntEx') return value.value.toString()
    return value
}

/**
 * Puts each `{ productLength, count }` row on one line.
 *
 * @param {string} json
 * @returns {string}
 */
const collapseHistograms = json => json
    .replace(/\{\s*"productLength":\s*(\d+),\s*"count":\s*(\d+)\s*}/g, '{ "productLength": $1, "count": $2 }')

/**
 * @param {ComputationState} state
 * @returns {string}
 */
const fn0 = state => collapseHistograms(JSON.stringify(state, replacer, '\t'))

// ---- fn_1: JS-source emitter (io/utils.js) ----
/**
 * @param {ComputationState} state
 * @returns {string}
 */
const fn1 = state => `export default ${toJs(state)}\n`

// ---- sanity: both produce parseable output; report byte size ----
{
    const out0 = fn0(pool[0])
    const out1 = fn1(pool[0])
    JSON.parse(out0)
    // eslint-disable-next-line no-new-func
    Function(`return (${out1.slice('export default '.length, -1)})`)()

    /**
     * @param {string} s
     * @returns {string} size of `s` in KB
     */
    const kb = s => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`
    console.log(`sample output — old: ${kb(out0)}   new: ${kb(out1)}`)
}

const L = pool.length
let i0 = 0
let i1 = 0

testPerformances({
    multiplyBy: 1,
    numIterations: 1_000_001,
    showAfter: 1000,
    warmupIterations: 500,
}, {
    getArgs: [() => pool[i0++ % L], () => pool[i1++ % L]],
    tests: [fn0, fn1],
})
