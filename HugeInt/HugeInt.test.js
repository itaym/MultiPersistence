/** Tests for HugeInt. */
import { HugeInt } from './HugeInt.js'
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

let seed = 0x1a2b3c4d

/**
 * Deterministic pseudo-random number in [0, 1).
 *
 * @returns {number}
 */
const rand = () => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff
    return seed / 0x7fffffff
}

/**
 * @param {number} n
 * @returns {number} random integer in [0, n)
 */
const randInt = n => Math.floor(rand() * n)

/**
 * Random non-negative BigInt of up to `maxDigits` digits in `base`.
 *
 * @param {bigint} base
 * @param {number} maxDigits
 * @returns {bigint}
 */
const randBig = (base, maxDigits) => {
    let value = 0n
    const digits = 1 + randInt(maxDigits)
    for (let i = 0; i < digits; i++) value = value * base + BigInt(randInt(Number(base)))
    return value
}

const VALUE_BASES = [2n, 3n, 7n, 10n, 16n, 64n, 256n]
const STRING_BASES = [2n, 8n, 10n, 16n, 36n] // native BigInt.toString caps at 36

/**
 * @param {bigint} value
 * @param {bigint} [base=10n]
 * @returns {HugeInt}
 */
const hi = (value, base = 10n) => new HugeInt(base, undefined, value)

// ---------------------------------------------------------------------------
// constructor + value
// ---------------------------------------------------------------------------

test(() => {
    for (const base of VALUE_BASES) {
        for (let i = 0; i < 300; i++) {
            const value = randBig(base, 90)
            assert.equal(hi(value, base).value, value, `base ${base}`)
        }
    }
}, 'constructor / value round-trip')

test(() => {
    assert.equal(hi(12_345n).base, 10n)
    assert.equal(hi(12_345n).value, 12_345n)
}, 'constructor default base is 10n')

test(() => {
    const n = hi(777_777n, 10n)
    assert.equal(n.cellsLength, 1)
    assert.equal(n.firstCell.digit, 7n)
    assert.equal(n.firstCell.count, 6n)
}, 'constructor compresses repeated digits')

test(() => {
    const z = hi(0n, 10n)
    assert.equal(z.cellsLength, 1)
    assert.equal(z.firstCell.digit, 0n)
    assert.equal(z.firstCell.count, 1n)
    assert.equal(z.firstCell, z.lastCell)
    assert.equal(z.value, 0n)
}, 'zero is a single [0,1] cell')

test(() => {
    assert.throws(() => new HugeInt(10n, () => ({ nope: true }), 1n), /valid DigitCell/)
}, 'constructor rejects a bad digitCellFactory')

test(() => {
    /** @returns {DigitCell} cell with an extra `tag` field */
    const factory = () => ({ changed: true, count: 1n, digit: 0n, next: null, prev: null, tag: 'x' })
    const n = new HugeInt(10n, factory, 123n)
    assert.equal([...n].every(cell => cell.tag === 'x'), true)
}, 'constructor accepts a custom digitCellFactory')

// ---------------------------------------------------------------------------
// getters
// ---------------------------------------------------------------------------

test(() => {
    assert.equal(hi(1n, 16n).base, 16n)
}, 'base getter')

test(() => {
    assert.equal(hi(0n).length, 1n)
    assert.equal(hi(9n).length, 1n)
    assert.equal(hi(1000n).length, 4n)
    assert.equal(HugeInt.fromGroups([[3n, 10n ** 15n]], 10n).length, 10n ** 15n)
}, 'length is the total digit count')

test(() => {
    assert.equal(hi(1_223_334_444n, 10n).cellsLength, 4)
}, 'cellsLength counts runs, not digits')

test(() => {
    const one = hi(5n, 10n)
    assert.equal(one.secondCell, null)
    assert.equal(one.beforeLastCell, null)

    const many = hi(123n, 10n) // cells: [3][2][1]
    assert.equal(many.secondCell.digit, 2n)
    assert.equal(many.beforeLastCell.digit, 2n)
}, 'secondCell / beforeLastCell')

// ---------------------------------------------------------------------------
// fromString / toString / toLocaleString
// ---------------------------------------------------------------------------

test(() => {
    for (const base of STRING_BASES) {
        for (let i = 0; i < 150; i++) {
            const value = randBig(base, 80)
            const str = value.toString(Number(base))
            const n = new HugeInt(10n, undefined, 0n).fromString(base, str)
            assert.equal(n.value, value, `base ${base}: ${str}`)
            assert.equal(n.toString(), str, `base ${base}: ${str}`)
        }
    }
}, 'fromString / toString round-trip')

test(() => {
    const n = new HugeInt(10n, undefined, 0n).fromString(16n, 'ff')
    assert.equal(n.base, 16n)
    assert.equal(n.value, 255n)
}, 'fromString updates the base')

test(() => {
    const n = new HugeInt(10n, undefined, 0n)
    assert.equal(n.fromString(10n, '42'), n)
}, 'fromString returns this (chainable)')

test(() => {
    const n = new HugeInt(10n, undefined, 0n)
    n.fromString(10n, '1'.repeat(10_001))
    assert.throws(() => n.value) // count came out undefined
}, 'QUIRK: fromString run length is capped by the toBigInt table (< 10000)')

test(() => {
    assert.equal(hi(255n, 16n).toString(), 'ff')
    assert.equal(hi(8n, 2n).toString(), '1000')
    assert.equal(hi(0n, 10n).toString(), '0')
}, 'toString in a non-decimal base')

test(() => {
    assert.equal(hi(0n).toLocaleString(), '0')
    assert.equal(hi(12n).toLocaleString(), '12')
    assert.equal(hi(123n).toLocaleString(), '123')
    assert.equal(hi(1234n).toLocaleString(), '1,234')
    assert.equal(hi(1_234_567n).toLocaleString(), '1,234,567')
}, 'toLocaleString groups by threes')

// ---------------------------------------------------------------------------
// iterator
// ---------------------------------------------------------------------------

test(() => {
    assert.deepEqual([...hi(123n, 10n)].map(cell => cell.digit), [3n, 2n, 1n])
}, 'Symbol.iterator yields cells LSB->MSB')

// ---------------------------------------------------------------------------
// cell surgery
// ---------------------------------------------------------------------------

test(() => {
    const n = hi(5n, 10n)
    /** @returns {DigitCell} */
    const factory = () => ({ changed: true, count: 1n, digit: 0n, next: null, prev: null })

    const hiCell = factory()
    hiCell.digit = 9n
    n.addCellAfter(hiCell, n.firstCell)
    assert.equal(n.lastCell, hiCell)
    assert.equal(n.value, 95n)

    const loCell = factory()
    loCell.digit = 1n
    n.addCellBefore(loCell, n.firstCell)
    assert.equal(n.firstCell, loCell)
    assert.equal(n.value, 951n)
}, 'addCellAfter / addCellBefore wire pointers and endpoints')

test(() => {
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
}, 'removeCell repairs first / last / middle')

test(() => {
    const a = new HugeInt(10n, undefined, 0n).fromString(10n, '5555')
    const tail = a.splitCellAfter(a.firstCell, 1n)
    assert.equal(a.firstCell.count, 1n)
    assert.equal(tail.count, 3n)
    assert.equal(tail.digit, 5n)
    assert.equal(a.value, 5555n)

    const b = new HugeInt(10n, undefined, 0n).fromString(10n, '5555')
    const head = b.splitCellBefore(b.firstCell, 1n)
    assert.equal(b.firstCell, head)
    assert.equal(head.count, 1n)
    assert.equal(b.value, 5555n)
}, 'splitCellAfter / splitCellBefore keep the value, split the run')

// ---------------------------------------------------------------------------
// addOne / subtractOne  (addOneToSorted lives in HugeIntEx.test.js)
// ---------------------------------------------------------------------------

test(() => {
    for (const base of [2n, 10n, 16n]) {
        for (let i = 0; i < 400; i++) {
            const value = randBig(base, 40)
            const n = hi(value, base)
            assert.equal((n.addOne()), undefined) // returns void
            assert.equal(n.value, value + 1n, `base ${base}: ${value}`)
        }
    }
}, 'addOne == +1')

test(() => {
    const n = hi(999n, 10n)
    n.addOne()
    assert.equal(n.value, 1000n)
    assert.equal(n.toString(), '1000')
}, 'addOne rolls a full carry into a new leading 1')

test(() => {
    for (const base of [2n, 10n, 16n]) {
        for (let i = 0; i < 400; i++) {
            const value = randBig(base, 40)
            const n = hi(value, base)
            n.subtractOne()
            assert.equal(n.value, value === 0n ? 0n : value - 1n, `base ${base}: ${value}`)
        }
    }
}, 'subtractOne == -1, clamped at zero')

test(() => {
    const n = hi(123_456n, 10n)
    n.addOne()
    n.subtractOne()
    assert.equal(n.value, 123_456n)
}, 'addOne then subtractOne is identity for non-rollover values')

// ---------------------------------------------------------------------------
// classification
// ---------------------------------------------------------------------------

test(() => {
    assert.equal(hi(0n, 10n).isZero(), true)
    assert.equal(hi(1n, 10n).isZero(), false)

    assert.equal(hi(5n, 10n).isLTBase(), true)
    assert.equal(hi(10n, 10n).isLTBase(), false)
    assert.equal(hi(55n, 10n).isLTBase(), false)

    assert.ok(!hi(9n, 10n).isGTBase()) // returns null (falsy) for a lone cell
    assert.ok(hi(10n, 10n).isGTBase())
    assert.ok(hi(55n, 10n).isGTBase())

    assert.equal(hi(1234n, 10n).moduloBase(), 4n)
    assert.equal(hi(1230n, 10n).moduloBase(), 0n)
}, 'isZero / isLTBase / isGTBase / moduloBase')

// ---------------------------------------------------------------------------
// digit queries
// ---------------------------------------------------------------------------

test(() => {
    const n = new HugeInt(10n, undefined, 0n).fromString(10n, '112233')
    assert.equal(n.digitCount(2n), 2n)
    assert.equal(n.digitCount(9n), 0n)

    assert.equal(n.getCellOf(3n).digit, 3n)
    assert.equal(n.getCellOf(9n), null)
    assert.equal(n.isCellOf(1n), true)
    assert.equal(n.isCellOf(8n), false)
}, 'digitCount / getCellOf / isCellOf')

test(() => {
    assert.equal(new HugeInt(10n, undefined, 0n).fromString(10n, '13579').hasEvenDigits(), false)
    assert.equal(new HugeInt(10n, undefined, 0n).fromString(10n, '13570').hasEvenDigits(), true)
    assert.equal(hi(2n, 10n).hasEvenDigits(), true)
}, 'hasEvenDigits (0 counts as even)')

/**
 * @param {string} str
 * @param {bigint} [base=10n]
 * @returns {HugeInt}
 */
const fs = (str, base = 10n) => new HugeInt(base, undefined, 0n).fromString(base, str)

test(() => {
    assert.equal(hi(4n, 10n).factorCountOf(2n), 2n)
    assert.equal(fs('44').factorCountOf(2n), 4n)
    assert.equal(fs('38').factorCountOf(2n), 3n)
    assert.equal(hi(6n, 10n).factorCountOf(2n), 1n)   // 6 = 2·3, not a pure power
    assert.equal(fs('248').factorCountOf(2n), 1n + 2n + 3n)
    assert.equal(fs('13579').factorCountOf(2n), 0n)
}, 'factorCountOf — exponent of a factor in the digit product')

test(() => {
    assert.equal(fs('39').factorCountOf(3n), 3n) // 3·9 = 3³
    assert.equal(fs('26').factorCountOf(3n), 1n) // only the 6
    assert.equal(fs('55').factorCountOf(5n), 2n)
    assert.equal(fs('77').factorCountOf(7n), 2n)
}, 'factorCountOf — factors other than 2')

test(() => {
    assert.equal(HugeInt.fromGroups([[8n, 10n ** 12n]], 10n).factorCountOf(2n), 3n * 10n ** 12n)
    assert.equal(HugeInt.fromGroups([[4n, 5n], [8n, 3n]], 10n).factorCountOf(2n), 2n * 5n + 3n * 3n)
}, 'factorCountOf — scales with the run count')

test(() => {
    const n = fs('842') // cells LSB: [2][4][8]
    assert.equal(n.factorCountOf(2n, n.firstCell.next), 2n + 3n) // 4 and 8, not the 2
}, 'factorCountOf — cell arg scans from there')

test(() => {
    assert.equal(fs('204').factorCountOf(2n), 1n + 2n) // the 0 adds 0
}, 'factorCountOf — a 0 digit contributes nothing')

// ---------------------------------------------------------------------------
// static helpers
// ---------------------------------------------------------------------------

test(() => {
    assert.equal(HugeInt.maxBigInt(3n, 7n, 2n, 5n), 7n)
    assert.equal(HugeInt.minBigInt(3n, 7n, 2n, 5n), 2n)
}, 'maxBigInt / minBigInt')

test(() => {
    assert.equal(HugeInt.fromGroups([[5n, 3n]], 10n).value, 555n)
    assert.equal(HugeInt.fromGroups([[0n, 4n]], 10n).isZero(), true)          // all-zero -> [0,1]
    // trailing zeros trimmed away? no: leading
    assert.equal(HugeInt.fromGroups([[1n, 1n], [0n, 3n]], 10n).cellsLength, 1)
    assert.equal(HugeInt.fromGroups([[3n, 2n], [3n, 4n]], 10n).cellsLength, 1) // equal neighbours merged
}, 'fromGroups builds the list and normalizes')

// ---------------------------------------------------------------------------
// arithmetic (light — exhaustively fuzzed in multiply.test.js)
// ---------------------------------------------------------------------------

test(() => {
    const n = hi(12n, 10n)
    assert.equal(n.add(3n), n)
    assert.equal(n.value, 15n)
    assert.equal(n.multiply(2n), n)
    assert.equal(n.value, 30n)
    assert.equal(n.multiplyByDigit(3n), n)
    assert.equal(n.value, 90n)
    assert.equal(n.shiftLeft(2n), n)
    assert.equal(n.value, 9000n)
}, 'add / multiply / multiplyByDigit / shiftLeft return this and mutate in place')

test(() => {
    assert.equal(hi(0n, 10n).shiftLeft(5n).value, 0n)
    assert.equal(hi(7n, 10n).shiftLeft(0n).value, 7n)
    assert.equal(hi(100n, 10n).shiftLeft(2n).value, 10_000n)
    assert.throws(() => hi(1n, 10n).shiftLeft(-1n), RangeError)
    assert.throws(() => hi(1n, 10n).shiftLeft(3), RangeError) // number, not bigint
}, 'shiftLeft edge cases')

test(() => {
    assert.throws(() => hi(5n, 10n).multiplyByDigit(10n), RangeError)
    assert.throws(() => hi(5n, 10n).multiplyByDigit(-1n), RangeError)
    assert.throws(() => hi(5n, 10n).multiplyByDigit(3), RangeError)
}, 'multiplyByDigit rejects out-of-range digits')

test(() => {
    assert.equal(hi(10n, 10n).add(hi(5n, 10n)).value, 15n)
    assert.equal(hi(10n, 10n).add(5n).value, 15n)
    assert.equal(hi(10n, 10n).add(5).value, 15n)
    assert.throws(() => hi(10n, 10n).add(2.5), RangeError)
    assert.throws(() => hi(10n, 10n).add('5'), TypeError)
}, 'add accepts HugeInt | bigint | number')

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
