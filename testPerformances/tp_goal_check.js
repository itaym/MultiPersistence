/** Benchmark: cost of the per-iteration goal check vs no check. */
import HugeIntEx from '#HugeIntEx/index.js'
import testPerformances from './testPerformances.js'

const BASE = 11n
const goalLength = 400n
const goalNo = new HugeIntEx(BASE, undefined, 0n).fromString(BASE, '2'.repeat(400))

// ---- pool of real currentNo instances ----
const pool = []
const walk = new HugeIntEx(BASE, undefined, 2n)

for (let step = 0; step < 20_000; step++) {
    pool.push(new HugeIntEx(BASE, undefined, walk.value))
    walk.addOneToSorted()
}

// ---- fn_0: current check ----
/**
 * Current goal check.
 *
 * @param {HugeIntEx} currentNo
 * @returns {boolean}
 */
const fn0 = currentNo => currentNo.length >= goalLength || currentNo.compare(goalNo) >= 0

// ---- fn_1: no check ----
/**
 * No check.
 *
 * @returns {boolean} `false`
 */
const fn1 = () => false

const L = pool.length
let i0 = 0
let i1 = 0

testPerformances({
    multiplyBy: 1,
    numIterations: 50_000_001,
    showAfter: 5_000_000,
    warmupIterations: 2_000_000,
}, {
    getArgs: [() => pool[i0++ % L], () => pool[i1++ % L]],
    tests: [fn0, fn1],
})
