/**
 * multiPerSearch's break-condition check: `currentNo.length >= goalLength || currentNo.compare(goalNo) >= 0`.
 * goal_number/goal_power_of10 are becoming planning-only (logging + SegmentsManager sizing), so
 * the main loop may no longer need to check them at all. How much does keeping the check cost?
 *
 * fn_0 — current: length check + compare
 * fn_1 — proposed: no check at all
 *
 * Pool: real currentNo instances from walking base-11 (prime, no accommodate skips) canonical
 * candidates with addOneToSorted, well short of goalNo so fn_0 never short-circuits on length.
 */

import testPerformances from './testPerformances.js'
import HugeIntEx from '#HugeIntEx/index.js'

const BASE = 11n
const goalLength = 400n
const goalNo = new HugeIntEx(0n, BASE).fromString('2'.repeat(400), BASE)

// ---- pool of real currentNo instances ----
const pool = []
const walk = new HugeIntEx(2n, BASE)
for (let step = 0; step < 20_000; step++) {
    pool.push(new HugeIntEx(walk.value, BASE))
    walk.addOneToSorted()
}

// ---- fn_0: current check ----
const fn0 = (currentNo) => currentNo.length >= goalLength || currentNo.compare(goalNo) >= 0

// ---- fn_1: no check ----
const fn1 = () => false

const L = pool.length
let i0 = 0, i1 = 0

testPerformances({
    getArgs: [() => pool[i0++ % L], () => pool[i1++ % L]],
    tests: [fn0, fn1],
}, {
    multiplyBy: 1,
    numIterations: 50_000_001,
    showAfter: 5_000_000,
    warmupIterations: 2_000_000,
})
