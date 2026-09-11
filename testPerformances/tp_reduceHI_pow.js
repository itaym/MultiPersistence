/**
 * `reduceHI`'s inner line: `multiplySum *= cell.count === 1n ? cell.digit : cell.digit ** cell.count`.
 * Is the `count === 1n` special-case worth the branch, or does `digit ** 1n` already cost nothing?
 *
 * fn_0 — current: `count === 1n ? digit : digit ** count`
 * fn_1 — always:  `digit ** count`
 *
 * Pool: real `(digit, count)` cells from walking base-9 canonical candidates with
 * `addOneToSorted`, plus a few deep numbers (long 2-runs) to cover big counts.
 */

import testPerformances from './testPerformances.js'
import HugeIntEx from '#HugeIntEx/index.js'

// ---- pool of real reduceHI cells ----
const pool = []

const walk = new HugeIntEx(2n, 9n)
for (let step = 0; step < 4000 && pool.length < 3000; step++) {
    for (let c = walk.firstCell; c; c = c.next) pool.push([c.digit, c.count])
    walk.addOneToSorted()
}

for (const len of [50, 120, 300, 480]) {
    const deep = new HugeIntEx(0n, 9n).fromString('2'.repeat(len - 3) + '678', 9n)
    for (let c = deep.firstCell; c; c = c.next) pool.push([c.digit, c.count])
}

// ---- fn_0: current ternary ----
const fn0 = ([digit, count]) => (count === 1n ? digit : digit ** count)

// ---- fn_1: always ** ----
const fn1 = ([digit, count]) => digit ** count

// ---- sanity: identical results ----
for (const pair of pool) {
    if (fn0(pair) !== fn1(pair)) throw new Error(`mismatch on ${pair}`)
}

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
