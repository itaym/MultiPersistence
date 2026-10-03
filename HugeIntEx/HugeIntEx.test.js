/** Tests for HugeIntEx. */
import HugeInt from '#HugeInt/index.js'
import { HugeIntEx } from './HugeIntEx.js'
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
 * @param {bigint} value
 * @param {bigint} [base=10n]
 * @returns {HugeIntEx}
 */
const ex = (value, base = 10n) => new HugeIntEx(base, undefined, value)

/**
 * @param {string} str
 * @param {bigint} [base=10n]
 * @returns {HugeIntEx}
 */
const fs = (str, base = 10n) => new HugeIntEx(base, undefined, 0n).fromString(base, str)

// ---------------------------------------------------------------------------
// inheritance
// ---------------------------------------------------------------------------

test(() => {
    assert.ok(ex(12n, 10n) instanceof HugeInt)
    assert.equal(ex(12n, 10n).multiply(3n).value, 36n)
    assert.equal(ex(12n, 10n).add(4n).value, 16n)
    assert.equal(fs('88').factorCountOf(2n), 6n) // inherited: 8·8 = 2⁶
}, 'HugeIntEx is a HugeInt and inherits the base surface')

test(() => {
    /** @returns {DigitCell} search-style cell */
    const factory = () => ({
        additionSum: 0n, changed: true, count: 1n, digit: 0n, multiplySum: 0n, next: null, prev: null,
    })
    const n = new HugeIntEx(10n, factory, 29n)
    n.addOneToSorted() // 29 -> 33, merged into one [3,2] cell
    assert.equal(n.value, 33n)
    assert.equal(n.cellsLength, 1)
    assert.equal([...n].every(cell => 'multiplySum' in cell), true)
}, 'custom digitCellFactory (search-style) flows through addOneToSorted')

// ---------------------------------------------------------------------------
// addOneToSorted — enumerates the canonical no-0/no-1 candidates in value order
// ---------------------------------------------------------------------------

/**
 * Digit strings `addOneToSorted` should visit, in order: non-decreasing digits of at least 2, up to `maxDigits` long.
 *
 * @param {bigint} base
 * @param {number} maxDigits
 * @returns {Generator<string>}
 */
function* canonicalReps(base, maxDigits) {
    for (let k = 1; k <= maxDigits; k++) {
        const digits = new Array(k).fill(2n)
        for (;;) {
            yield digits.reduce((acc, d) => acc * base + d, 0n)
            let i = k - 1
            while (i >= 0 && digits[i] === base - 1n) i--
            if (i < 0) break
            digits[i]++
            for (let j = i + 1; j < k; j++) digits[j] = digits[i]
        }
    }
}

test(() => {
    for (const base of [6n, 8n, 10n, 12n, 16n]) {
        const want = canonicalReps(base, 4)
        want.next() // first rep == starting value
        const n = ex(2n, base)
        assert.equal((n.addOneToSorted()), undefined) // void
        let steps = 0
        for (const rep of want) {
            assert.equal(n.value, rep, `base ${base} step ${steps}`)
            n.addOneToSorted()
            if (++steps > 2000) break
        }
    }
}, 'addOneToSorted walks the canonical candidates')

test(() => {
    const n = ex(2n, 9n)
    for (let i = 0; i < 5000; i++) {
        let prev = null
        for (const cell of n) {
            assert.ok(cell.digit >= 0n && cell.digit < 9n, `digit ${cell.digit} out of base`)
            if (prev !== null) assert.ok(cell.digit < prev, 'run not merged / not sorted')
            prev = cell.digit
        }
        n.addOneToSorted()
    }
}, 'addOneToSorted keeps runs merged and digits non-increasing LSB->MSB')

test(() => {
    /**
     * @param {string} str
     * @param {bigint} [base=10n]
     * @returns {string} the number after `str`, as a string
     */
    const step = (str, base = 10n) => {
        const n = new HugeIntEx(base, undefined, 0n).fromString(base, str)
        n.addOneToSorted()
        return n.toString()
    }
    assert.equal(step('9'), '22')        // single digit rolls over
    assert.equal(step('29'), '33')       // carry merges: [9,1][2,1] -> [3,2]
    assert.equal(step('89'), '99')       // [9,1][8,1] -> [9,2]
    assert.equal(step('99'), '222')      // all nines
    assert.equal(step('2299'), '2333')   // carry consumes ONE digit of the next run
    assert.equal(step('8', 9n), '22')    // base 9: 8 is base-1
    assert.equal(step('88', 9n), '222')  // base 9
}, 'addOneToSorted — key transitions')

test(() => {
    const n = ex(99n, 10n)
    n.addOneToSorted()
    assert.equal(n.value, 222n)
    assert.equal(n.cellsLength, 1)
    assert.equal(n.firstCell.digit, 2n)
    assert.equal(n.firstCell.count, 3n)
}, 'addOneToSorted — rollover merges into one cell')

// ---------------------------------------------------------------------------
// getDigits
// ---------------------------------------------------------------------------

test(() => {
    assert.deepEqual(fs('25777').getDigits(), [2n, 5n, 7n])   // "25777" -> {2,5,7}
    assert.deepEqual(fs('2').getDigits(), [2n])
    assert.deepEqual(ex(0n, 10n).getDigits(), [0n])
    // step through a few canonical candidates
    const n = ex(2n, 9n)
    n.addOneToSorted() // 3
    n.addOneToSorted() // 4
    assert.deepEqual(n.getDigits(), [4n])
}, 'getDigits — distinct digits, smallest first')

// ---------------------------------------------------------------------------
// length (cached)
// ---------------------------------------------------------------------------

test(() => {
    const n = ex(2n, 9n)
    assert.equal(n.length, 1n)
    for (let i = 0; i < 7; i++) n.addOneToSorted()   // 2..8 then 8 -> "22"
    assert.equal(n.toString(), '22')
    assert.equal(n.length, 2n)

    n.fromString(9n, '888')
    assert.equal(n.length, 3n)
    n.addOneToSorted()                                // 888 -> 2222
    assert.equal(n.length, 4n)

    // non-decreasing walk without a rollover keeps the length put
    n.fromString(10n, '23')
    assert.equal(n.length, 2n)
    n.addOneToSorted()                                // 23 -> 24
    assert.equal(n.length, 2n)
}, 'length is cached and stays exact through addOneToSorted / fromString')

test(() => {
    const m = ex(12n, 10n)
    assert.equal(m.length, 2n)
    m.multiply(1000n)                                 // 12000
    assert.equal(m.length, 5n)
    m.add(5n)                                         // 12005
    assert.equal(m.length, 5n)
    m.subtractOne()                                   // 12004
    assert.equal(m.length, 5n)
}, 'length recomputes after an inherited mutator')

// ---------------------------------------------------------------------------
// countTwoComponents
// ---------------------------------------------------------------------------

test(() => {
    assert.equal(fs('248').countTwoComponents(), 6)
    assert.equal(fs('842').countTwoComponentsNoFirstCell(), 5) // 4 and 8, not the 2
    // QUIRK: on a lone cell, firstCell.next is null and countTwoComponents
    // falls back to firstCell — nothing is excluded.
    assert.equal(ex(4n, 10n).countTwoComponentsNoFirstCell(), 2)
}, 'countTwoComponents / …NoFirstCell delegate to factorCountOf(2n, …)')

// ---------------------------------------------------------------------------
// compare
// ---------------------------------------------------------------------------

test(() => {
    assert.equal(fs('999').compare(fs('2222')), -1)          // fewer digits -> smaller
    assert.equal(fs('2222').compare(fs('999')), 1)
    assert.equal(fs('2234').compare(fs('3334')), -1)         // lower MSB digit
    assert.equal(fs('3334').compare(fs('2234')), 1)
    assert.equal(fs('2223').compare(fs('2233')), -1)         // longer run of 2s -> smaller
    assert.equal(fs('2233').compare(fs('2223')), 1)
    assert.equal(fs('2245').compare(fs('2255')), -1)         // tiebreak one cell deeper
    assert.equal(fs('2333').compare(fs('2333')), 0)          // equal
    assert.equal(fs('223', 6n).compare(fs('233', 6n)), -1)   // base 6
}, 'compare — length, digit, run-length tiebreak')

test(() => {
    for (const base of [3n, 6n, 9n, 10n, 16n]) {
        const nums = []
        const walk = ex(2n, base)
        for (let i = 0; i < 60; i++) {
            nums.push({ hi: fs(walk.toString(), base), v: walk.value })
            walk.addOneToSorted()
        }
        for (const a of nums) {
            for (const b of nums) {
                const want = a.v < b.v ? -1 : a.v > b.v ? 1 : 0
                assert.equal(a.hi.compare(b.hi), want, `base ${base}: ${a.v} vs ${b.v}`)
            }
        }
    }
}, 'compare matches numeric order across a canonical sweep')

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
