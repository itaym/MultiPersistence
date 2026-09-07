/**
 * Tests for {@link multiPer} / {@link multiPerNBC} — multiplicative persistence
 * over a HugeInt, plus the shared-`result` contract.
 *
 *     node MultiplicativePersistence/multiplicativePersistence.test.js
 */

import assert from 'node:assert/strict'
import { HugeIntEx } from '../HugeIntEx/HugeIntEx.js'
import { multiPer, multiPerNBC } from './multiplicativePersistence.js'

let passed = 0
let failed = 0

/** @param {string} name @param {() => void} fn */
function test(name, fn) {
    try {
        fn()
        passed++
    } catch (err) {
        failed++
        console.error(`✗ ${name}`)
        console.error(`  ${err.stack?.split('\n').slice(0, 3).join('\n  ') ?? err.message}`)
    }
}

const searchCell = () => ({
    additionSum: 0n, changed: true, count: 1n, digit: 0n, multiplySum: 0n, next: null, prev: null,
})

/** persistence of `v` in base 10, entry through the same door multiPerSearch uses */
const per = (v) => {
    const n = new HugeIntEx(BigInt(v), 10n, searchCell)
    return (n.isLTBase() ? multiPer : multiPerNBC)(n, 10).steps
}

test('known base-10 persistence values', () => {
    for (const [v, want] of [
        [4, 0], [10, 1], [25, 2], [39, 3], [77, 4], [679, 5], [6788, 6],
        [68889, 7], [2677889, 8], [26888999, 9], [3778888999n, 10],
    ]) {
        assert.equal(per(v), want, `per(${v})`)
    }
})

test('multiPerNBC reports productLength (digits of the step-1 product)', () => {
    // 99: 9*9 = 81 -> 8*1 = 8   => 2 steps, step-1 product "81" has 2 digits
    const n = new HugeIntEx(99n, 10n, searchCell)
    const r = multiPerNBC(n, 10)
    assert.equal(r.multiplySum, 81n)
    assert.equal(r.productLength, 2)
    assert.equal(r.steps, 2)
})

test('a zero digit in the step-1 product ends the chain', () => {
    // 55: 5*5 = 25 -> 2*5 = 10 -> 1*0 = 0   => 3 steps
    const n = new HugeIntEx(55n, 10n, searchCell)
    assert.equal(multiPerNBC(n, 10).steps, 3)
})

test('result object is shared and overwritten each call', () => {
    const a = multiPerNBC(new HugeIntEx(77n, 10n, searchCell), 10)
    const stepsA = a.steps
    const b = multiPerNBC(new HugeIntEx(25n, 10n, searchCell), 10)
    assert.equal(a, b, 'same object')
    assert.notEqual(a.steps, stepsA, 'b overwrote a')
    assert.equal(b.steps, 2)
})

test('multiPer single-digit branch: steps 0, productLength 1', () => {
    const r = multiPer(new HugeIntEx(7n, 10n, searchCell), 10)
    assert.equal(r.steps, 0)
    assert.equal(r.productLength, 1)
    assert.equal(r.multiplySum, 7n)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
