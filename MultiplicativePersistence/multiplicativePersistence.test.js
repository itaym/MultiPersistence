/** Tests for multiPer / multiPerNBC. */
import HugeIntEx from '#HugeIntEx/index.js'
import {
    multiPer,
    multiPerNBC,
} from './multiplicativePersistence.js'
import assert from 'node:assert/strict'

let passed = 0
let failed = 0

/**
 * Runs `fn`, counting and logging a failure.
 *
 * @param {() => void} fn
 * @param {string} name
 * @returns {void}
 */
const test = (fn, name) => {
    try {
        fn()
        passed++
    } catch (err) {
        failed++
        console.error(`✗ ${name}`)
        console.error(`  ${err.stack?.split('\n').slice(0, 3).join('\n  ') ?? err.message}`)
    }
}

/**
 * Search-style digit cell.
 *
 * @returns {DigitCell}
 */
const searchCell = () => ({
    additionSum: 0n, changed: true, count: 1n, digit: 0n, multiplySum: 0n, next: null, prev: null,
})

/**
 * Base-10 persistence of `v`, through the same entry points the search uses.
 *
 * @param {bigint} v
 * @returns {number}
 */
const per = v => {
    const n = new HugeIntEx(10n, searchCell, BigInt(v))
    return (n.isLTBase() ? multiPer : multiPerNBC)(10, n).steps
}

test(() => {
    for (const [v, want] of [
        [4, 0], [10, 1], [25, 2], [39, 3], [77, 4], [679, 5], [6788, 6],
        [68_889, 7], [2_677_889, 8], [26_888_999, 9], [3_778_888_999n, 10],
    ]) {
        assert.equal(per(v), want, `per(${v})`)
    }
}, 'known base-10 persistence values')

test(() => {
    // 99: 9*9 = 81 -> 8*1 = 8   => 2 steps, step-1 product "81" has 2 digits
    const n = new HugeIntEx(10n, searchCell, 99n)
    const r = multiPerNBC(10, n)
    assert.equal(r.multiplySum, 81n)
    assert.equal(r.productLength, 2)
    assert.equal(r.steps, 2)
}, 'multiPerNBC reports productLength (digits of the step-1 product)')

test(() => {
    // 55: 5*5 = 25 -> 2*5 = 10 -> 1*0 = 0   => 3 steps
    const n = new HugeIntEx(10n, searchCell, 55n)
    assert.equal(multiPerNBC(10, n).steps, 3)
}, 'a zero digit in the step-1 product ends the chain')

test(() => {
    const a = multiPerNBC(10, new HugeIntEx(10n, searchCell, 77n))
    const stepsA = a.steps
    const b = multiPerNBC(10, new HugeIntEx(10n, searchCell, 25n))
    assert.equal(a, b, 'same object')
    assert.notEqual(a.steps, stepsA, 'b overwrote a')
    assert.equal(b.steps, 2)
}, 'result object is shared and overwritten each call')

test(() => {
    const r = multiPer(10, new HugeIntEx(10n, searchCell, 7n))
    assert.equal(r.steps, 0)
    assert.equal(r.productLength, 1)
    assert.equal(r.multiplySum, 7n)
}, 'multiPer single-digit branch: steps 0, productLength 1')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
