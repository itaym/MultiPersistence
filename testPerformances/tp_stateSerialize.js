/**
 * Results-file serialization: the computation-state object -> a string ready for
 * disk. This is the CPU part of a checkpoint save; the `writeFile` after it is
 * identical for both and not measured here.
 *
 * fn_0 — current: `JSON.stringify(state, replacer, '\t')` then the
 *        `collapseHistograms` regex. The replacer stringifies every BigInt and
 *        rebuilds each `productLengths` map into a sorted
 *        `[{ productLength, count }]` array.
 * fn_1 — new: a direct JS-source emitter. BigInt -> `123n` literal, identifier
 *        keys left unquoted, histograms stay plain maps (no array transform, no
 *        regex pass). Output is an ESM module (`export default { ... }`) that
 *        loads back with a plain `import`.
 *
 * Pool: synthetic ComputationState objects sized by the knobs below — a `steps`
 * array plus `number_lengths` buckets, each carrying `productLengths` /
 * `additionSums` histograms. Raise LENGTH_BUCKETS / HIST_KEYS / STEPS to model a
 * high-base checkpoint.
 */

import testPerformances from './testPerformances.js'
import { toJs } from '#io/utils.js'

// ---- size knobs (mid-size checkpoint by default) ----
const STEPS = 10
const LENGTH_BUCKETS = 60
const HIST_KEYS = 60
const POOL = 6

// ---- seeded rng ----
let seed = 0x51ed2ab9
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const int = (n) => Math.floor(rnd() * n)

const bigDigits = (n) => {
    let v = 0n
    for (let i = 0; i < n; i++) v = v * 10n + BigInt(int(10))
    return v
}

/** ~`keys` distinct numeric-string keys -> small counts. */
const hist = (keys) => {
    const h = {}
    for (let i = 0; i < keys; i++) h[1 + int(keys * 3)] = 1 + int(50)
    return h
}

const snapshot = () => ({
    additionSum: BigInt(int(9999)),
    numberValue: bigDigits(40 + int(400)),
    multiplySum: BigInt(int(1 << 30)),
})

const stepBucket = (step) => ({
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
        base: BigInt(20 + int(40)),
        iterations: {
            calculated: bigDigits(18),
            count: int(2e9),
            found_nothing: int(1e6),
            found_nothing_break_at: 1_000_000_000,
        },
        last_number: bigDigits(60 + int(500)),
        number_lengths,
        steps,
        up_time: int(1e9),
    }
}

const pool = Array.from({ length: POOL }, makeState)

// ---- fn_0: current serializer (copied from Config/computationStateIO.js) ----
const replacer = (key, value) => {
    if (key === 'productLengths' && value && !Array.isArray(value)) {
        return Object.entries(value)
            .map(([productLength, count]) => ({ productLength: Number(productLength), count }))
            .sort((a, b) => a.productLength - b.productLength)
    }
    const name = value?.constructor?.name
    if (name === 'BigInt') return value.toString()
    if (name === 'HugeInt' || name === 'HugeIntEx') return value.value.toString()
    return value
}
const collapseHistograms = (json) => json
    .replace(/\{\s*"productLength":\s*(\d+),\s*"count":\s*(\d+)\s*}/g, '{ "productLength": $1, "count": $2 }')

const fn0 = (state) => collapseHistograms(JSON.stringify(state, replacer, '\t'))

// ---- fn_1: JS-source emitter (io/utils.js) ----
const fn1 = (state) => `export default ${toJs(state)}\n`

// ---- sanity: both produce parseable output; report byte size ----
{
    const out0 = fn0(pool[0])
    const out1 = fn1(pool[0])
    JSON.parse(out0)
    // eslint-disable-next-line no-new-func
    Function(`return (${out1.slice('export default '.length, -1)})`)()

    const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`
    console.log(`sample output — old: ${kb(out0)}   new: ${kb(out1)}`)
}

const L = pool.length
let i0 = 0, i1 = 0

testPerformances({
    getArgs: [() => pool[i0++ % L], () => pool[i1++ % L]],
    tests: [fn0, fn1],
}, {
    multiplyBy: 1,
    numIterations: 1_000_001,
    showAfter: 1_000,
    warmupIterations: 500,
})
