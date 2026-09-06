/**
 * Standalone tests for the {@link HugeInt} class surface.
 *
 *     node HugeInt/HugeInt.test.js
 *
 * No test runner — plain assertions with native `BigInt` as the oracle. Where a
 * method deliberately deviates from ordinary integer arithmetic (the
 * multiplicative-persistence search hooks), the current behaviour is pinned
 * explicitly and labelled QUIRK.
 */

import assert from 'node:assert/strict'
import { HugeInt } from './HugeInt.js'

let passed = 0
let failed = 0

/** @param {string} name
 * @param {() => void} fn */
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

let seed = 0x1a2b3c4d
const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
}
const randInt = (n) => Math.floor(rand() * n)

/** random non-negative bigint with up to `maxDigits` digits in `base` */
function randBig(maxDigits, base) {
    let value = 0n
    const digits = 1 + randInt(maxDigits)
    for (let i = 0; i < digits; i++) value = value * base + BigInt(randInt(Number(base)))
    return value
}

const VALUE_BASES = [2n, 3n, 7n, 10n, 16n, 64n, 256n]
const STRING_BASES = [2n, 8n, 10n, 16n, 36n] // native BigInt.toString caps at 36

const hi = (value, base = 10n) => new HugeInt(value, base)

// ---------------------------------------------------------------------------
// constructor + value
// ---------------------------------------------------------------------------

test('constructor / value round-trip', () => {
    for (const base of VALUE_BASES) {
        for (let i = 0; i < 300; i++) {
            const value = randBig(90, base)
            assert.equal(hi(value, base).value, value, `base ${base}`)
        }
    }
})

test('constructor default base is 10n', () => {
    assert.equal(hi(12345n).base, 10n)
    assert.equal(hi(12345n).value, 12345n)
})

test('constructor compresses repeated digits', () => {
    const n = hi(777_777n, 10n)
    assert.equal(n.cellsLength, 1)
    assert.equal(n.firstCell.digit, 7n)
    assert.equal(n.firstCell.count, 6n)
})

test('zero is a single [0,1] cell', () => {
    const z = hi(0n, 10n)
    assert.equal(z.cellsLength, 1)
    assert.equal(z.firstCell.digit, 0n)
    assert.equal(z.firstCell.count, 1n)
    assert.equal(z.firstCell, z.lastCell)
    assert.equal(z.value, 0n)
})

test('constructor rejects a bad digitCellFactory', () => {
    assert.throws(() => new HugeInt(1n, 10n, () => (/** @type DigitCell */{ nope: true })), /valid DigitCell/)
})

test('constructor accepts a custom digitCellFactory', () => {
    const factory = () => (/** @type DigitCell */{ changed: true, count: 1n, digit: 0n, next: null, prev: null, tag: 'x' })
    const n = new HugeInt(123n, 10n, factory)
    assert.equal([...n].every((cell) => cell.tag === 'x'), true)
})

// ---------------------------------------------------------------------------
// getters
// ---------------------------------------------------------------------------

test('base getter', () => {
    assert.equal(hi(1n, 16n).base, 16n)
})

test('length is the total digit count', () => {
    assert.equal(hi(0n).length, 1n)
    assert.equal(hi(9n).length, 1n)
    assert.equal(hi(1_000n).length, 4n)
    assert.equal(HugeInt.fromRuns([[3n, 10n ** 15n]], 10n).length, 10n ** 15n)
})

test('cellsLength counts runs, not digits', () => {
    assert.equal(hi(1_223_334_444n, 10n).cellsLength, 4)
})

test('secondCell / beforeLastCell', () => {
    const one = hi(5n, 10n)
    assert.equal(one.secondCell, null)
    assert.equal(one.beforeLastCell, null)

    const many = hi(123n, 10n) // cells: [3][2][1]
    assert.equal(many.secondCell.digit, 2n)
    assert.equal(many.beforeLastCell.digit, 2n)
})

// ---------------------------------------------------------------------------
// fromString / toString / toLocaleString
// ---------------------------------------------------------------------------

test('fromString / toString round-trip', () => {
    for (const base of STRING_BASES) {
        for (let i = 0; i < 150; i++) {
            const value = randBig(80, base)
            const str = value.toString(Number(base))
            const n = new HugeInt(0n, 10n).fromString(str, base)
            assert.equal(n.value, value, `base ${base}: ${str}`)
            assert.equal(n.toString(), str, `base ${base}: ${str}`)
        }
    }
})

test('fromString updates the base', () => {
    const n = new HugeInt(0n, 10n).fromString('ff', 16n)
    assert.equal(n.base, 16n)
    assert.equal(n.value, 255n)
})

test('fromString returns this (chainable)', () => {
    const n = new HugeInt(0n, 10n)
    assert.equal(n.fromString('42', 10n), n)
})

test('QUIRK: fromString run length is capped by the toBigInt table (< 10000)', () => {
    const n = new HugeInt(0n, 10n)
    n.fromString('1'.repeat(10_001), 10n)
    assert.throws(() => n.value) // count came out undefined
})

test('toString in a non-decimal base', () => {
    assert.equal(hi(255n, 16n).toString(), 'ff')
    assert.equal(hi(8n, 2n).toString(), '1000')
    assert.equal(hi(0n, 10n).toString(), '0')
})

test('toLocaleString groups by threes', () => {
    assert.equal(hi(0n).toLocaleString(), '0')
    assert.equal(hi(12n).toLocaleString(), '12')
    assert.equal(hi(123n).toLocaleString(), '123')
    assert.equal(hi(1234n).toLocaleString(), '1,234')
    assert.equal(hi(1_234_567n).toLocaleString(), '1,234,567')
})

// ---------------------------------------------------------------------------
// iterator
// ---------------------------------------------------------------------------

test('Symbol.iterator yields cells LSB->MSB', () => {
    assert.deepEqual([...hi(123n, 10n)].map((cell) => cell.digit), [3n, 2n, 1n])
})

// ---------------------------------------------------------------------------
// cell surgery
// ---------------------------------------------------------------------------

test('addCellAfter / addCellBefore wire pointers and endpoints', () => {
    const n = hi(5n, 10n)
    const factory = () => (/** @type DigitCell */{ changed: true, count: 1n, digit: 0n, next: null, prev: null })

    const hiCell = factory()
    hiCell.digit = 9n
    n.addCellAfter(n.firstCell, hiCell)
    assert.equal(n.lastCell, hiCell)
    assert.equal(n.value, 95n)

    const loCell = factory()
    loCell.digit = 1n
    n.addCellBefore(n.firstCell, loCell)
    assert.equal(n.firstCell, loCell)
    assert.equal(n.value, 951n)
})

test('removeCell repairs first / last / middle', () => {
    const mid = hi(123n, 10n) // [3][2][1]  — removeCell deletes the digit, shifting the rest down
    mid.removeCell(mid.firstCell.next)
    assert.equal(mid.value, 13n)

    const head = hi(123n, 10n)
    head.removeCell(head.firstCell)
    assert.equal(head.firstCell.digit, 2n)
    assert.equal(head.value, 12n)

    const tail = hi(123n, 10n)
    tail.removeCell(tail.lastCell)
    assert.equal(tail.lastCell.digit, 2n)
    assert.equal(tail.value, 23n)
})

test('splitCellAfter / splitCellBefore keep the value, split the run', () => {
    const a = new HugeInt(0n, 10n).fromString('5555', 10n)
    const tail = a.splitCellAfter(a.firstCell, 1n)
    assert.equal(a.firstCell.count, 1n)
    assert.equal(tail.count, 3n)
    assert.equal(tail.digit, 5n)
    assert.equal(a.value, 5555n)

    const b = new HugeInt(0n, 10n).fromString('5555', 10n)
    const head = b.splitCellBefore(b.firstCell, 1n)
    assert.equal(b.firstCell, head)
    assert.equal(head.count, 1n)
    assert.equal(b.value, 5555n)
})

// ---------------------------------------------------------------------------
// addOne / subtractOne  (addOneToSorted lives in HugeIntEx.test.js)
// ---------------------------------------------------------------------------

test('addOne == +1', () => {
    for (const base of [2n, 10n, 16n]) {
        for (let i = 0; i < 400; i++) {
            const value = randBig(40, base)
            const n = hi(value, base)
            assert.equal((/** @type any */ n.addOne()), undefined) // returns void
            assert.equal(n.value, value + 1n, `base ${base}: ${value}`)
        }
    }
})

test('addOne rolls a full carry into a new leading 1', () => {
    const n = hi(999n, 10n)
    n.addOne()
    assert.equal(n.value, 1000n)
    assert.equal(n.toString(), '1000')
})

test('subtractOne == -1, clamped at zero', () => {
    for (const base of [2n, 10n, 16n]) {
        for (let i = 0; i < 400; i++) {
            const value = randBig(40, base)
            const n = hi(value, base)
            n.subtractOne()
            assert.equal(n.value, value === 0n ? 0n : value - 1n, `base ${base}: ${value}`)
        }
    }
})

test('addOne then subtractOne is identity for non-rollover values', () => {
    const n = hi(123_456n, 10n)
    n.addOne()
    n.subtractOne()
    assert.equal(n.value, 123_456n)
})

// ---------------------------------------------------------------------------
// classification
// ---------------------------------------------------------------------------

test('isZero / isLTBase / isGTBase / moduloBase', () => {
    assert.equal(hi(0n, 10n).isZero(), true)
    assert.equal(hi(1n, 10n).isZero(), false)

    assert.equal(hi(5n, 10n).isLTBase(), true)
    assert.equal(hi(10n, 10n).isLTBase(), false)
    assert.equal(hi(55n, 10n).isLTBase(), false)

    assert.ok(!hi(9n, 10n).isGTBase()) // returns null (falsy) for a lone cell
    assert.ok(hi(10n, 10n).isGTBase())
    assert.ok(hi(55n, 10n).isGTBase())

    assert.equal(hi(1_234n, 10n).moduloBase(), 4n)
    assert.equal(hi(1_230n, 10n).moduloBase(), 0n)
})

// ---------------------------------------------------------------------------
// digit queries
// ---------------------------------------------------------------------------

test('digitCount / getCellOf / isCellOf', () => {
    const n = new HugeInt(0n, 10n).fromString('112233', 10n)
    assert.equal(n.digitCount(2n), 2n)
    assert.equal(n.digitCount(9n), 0n)

    assert.equal(n.getCellOf(3n).digit, 3n)
    assert.equal(n.getCellOf(9n), null)
    assert.equal(n.isCellOf(1n), true)
    assert.equal(n.isCellOf(8n), false)
})

test('hasEvenDigits (0 counts as even)', () => {
    assert.equal(new HugeInt(0n, 10n).fromString('13579', 10n).hasEvenDigits(), false)
    assert.equal(new HugeInt(0n, 10n).fromString('13570', 10n).hasEvenDigits(), true)
    assert.equal(hi(2n, 10n).hasEvenDigits(), true)
})

const fs = (str, base = 10n) => new HugeInt(0n, base).fromString(str, base)

test('factorCountOf — exponent of a factor in the digit product', () => {
    assert.equal(hi(4n, 10n).factorCountOf(2n), 2n)
    assert.equal(fs('44').factorCountOf(2n), 4n)
    assert.equal(fs('38').factorCountOf(2n), 3n)
    assert.equal(hi(6n, 10n).factorCountOf(2n), 1n)   // 6 = 2·3, not a pure power
    assert.equal(fs('248').factorCountOf(2n), 1n + 2n + 3n)
    assert.equal(fs('13579').factorCountOf(2n), 0n)
})

test('factorCountOf — factors other than 2', () => {
    assert.equal(fs('39').factorCountOf(3n), 3n) // 3·9 = 3³
    assert.equal(fs('26').factorCountOf(3n), 1n) // only the 6
    assert.equal(fs('55').factorCountOf(5n), 2n)
    assert.equal(fs('77').factorCountOf(7n), 2n)
})

test('factorCountOf — scales with the run count', () => {
    assert.equal(HugeInt.fromRuns([[8n, 10n ** 12n]], 10n).factorCountOf(2n), 3n * 10n ** 12n)
    assert.equal(HugeInt.fromRuns([[4n, 5n], [8n, 3n]], 10n).factorCountOf(2n), 2n * 5n + 3n * 3n)
})

test('factorCountOf — cell arg scans from there', () => {
    const n = fs('842') // cells LSB: [2][4][8]
    assert.equal(n.factorCountOf(2n, n.firstCell.next), 2n + 3n) // 4 and 8, not the 2
})

test('factorCountOf — a 0 digit contributes nothing', () => {
    assert.equal(fs('204').factorCountOf(2n), 1n + 2n) // the 0 adds 0
})

// ---------------------------------------------------------------------------
// static helpers
// ---------------------------------------------------------------------------

test('maxBigInt / minBigInt', () => {
    assert.equal(HugeInt.maxBigInt(3n, 7n, 2n, 5n), 7n)
    assert.equal(HugeInt.minBigInt(3n, 7n, 2n, 5n), 2n)
})

test('fromRuns builds the list and normalizes', () => {
    assert.equal(HugeInt.fromRuns([[5n, 3n]], 10n).value, 555n)
    assert.equal(HugeInt.fromRuns([[0n, 4n]], 10n).isZero(), true)          // all-zero -> [0,1]
    assert.equal(HugeInt.fromRuns([[1n, 1n], [0n, 3n]], 10n).cellsLength, 1) // trailing zeros trimmed away? no: leading
    assert.equal(HugeInt.fromRuns([[3n, 2n], [3n, 4n]], 10n).cellsLength, 1) // equal neighbours merged
})

// ---------------------------------------------------------------------------
// arithmetic (light — exhaustively fuzzed in multiply.test.js)
// ---------------------------------------------------------------------------

test('add / mul / mulSmall / shiftLeft return this and mutate in place', () => {
    const n = hi(12n, 10n)
    assert.equal(n.add(3n), n)
    assert.equal(n.value, 15n)
    assert.equal(n.mul(2n), n)
    assert.equal(n.value, 30n)
    assert.equal(n.mulSmall(3n), n)
    assert.equal(n.value, 90n)
    assert.equal(n.shiftLeft(2n), n)
    assert.equal(n.value, 9000n)
})

test('shiftLeft edge cases', () => {
    assert.equal(hi(0n, 10n).shiftLeft(5n).value, 0n)
    assert.equal(hi(7n, 10n).shiftLeft(0n).value, 7n)
    assert.equal(hi(100n, 10n).shiftLeft(2n).value, 10_000n)
    assert.throws(() => hi(1n, 10n).shiftLeft(-1n), RangeError)
    assert.throws(() => hi(1n, 10n).shiftLeft(/** @type BigInt (Only for the inspections) */ 3), RangeError) // number, not bigint
})

test('mulSmall rejects out-of-range digits', () => {
    assert.throws(() => hi(5n, 10n).mulSmall(10n), RangeError)
    assert.throws(() => hi(5n, 10n).mulSmall(-1n), RangeError)
    assert.throws(() => hi(5n, 10n).mulSmall(/** @type BigInt (Only for the inspections) */ 3), RangeError)
})

test('add accepts HugeInt | bigint | number', () => {
    assert.equal(hi(10n, 10n).add(hi(5n, 10n)).value, 15n)
    assert.equal(hi(10n, 10n).add(5n).value, 15n)
    assert.equal(hi(10n, 10n).add(5).value, 15n)
    assert.throws(() => hi(10n, 10n).add(2.5), RangeError)
    assert.throws(() => hi(10n, 10n).add(/** @type BigInt (Only for the inspections) */ '5'), TypeError)
})

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
