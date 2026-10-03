/** Benchmark: `count === 1n ? digit : digit ** count` vs always `digit ** count`. */
import HugeIntEx from '#HugeIntEx/index.js'
import testPerformances from './testPerformances.js'

// ---- pool of real reduceHI cells ----
const pool = []

const walk = new HugeIntEx(9n, undefined, 2n)

for (let step = 0; step < 4000 && pool.length < 3000; step++) {
    for (let c = walk.firstCell; c; c = c.next) pool.push([c.digit, c.count])
    walk.addOneToSorted()
}

for (const len of [50, 120, 300, 480]) {
    const deep = new HugeIntEx(9n, undefined, 0n).fromString(9n, '2'.repeat(len - 3) + '678')
    for (let c = deep.firstCell; c; c = c.next) pool.push([c.digit, c.count])
}

// ---- fn_0: current ternary ----
/**
 * Ternary power.
 *
 * @param {[bigint, bigint]} pair `[digit, count]`
 * @returns {bigint}
 */
const fn0 = ([digit, count]) => (count === 1n ? digit : digit ** count)

// ---- fn_1: always ** ----
/**
 * Plain power.
 *
 * @param {[bigint, bigint]} pair `[digit, count]`
 * @returns {bigint}
 */
const fn1 = ([digit, count]) => digit ** count

// ---- sanity: identical results ----
for (const pair of pool) {
    if (fn0(pair) !== fn1(pair)) throw new Error(`mismatch on ${pair}`)
}

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
