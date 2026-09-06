/**
 * Standalone tests for digit-group-native multiplication.
 *
 *     node HugeInt/multiply.test.js
 *
 * No test runner — plain assertions against native `BigInt` as the oracle, plus
 * a few closed-form checks at a scale `BigInt` cannot reach.
 */

import assert from 'node:assert/strict'
import { HugeInt, BudgetExceededError } from './HugeInt.js'
import {
    addGroups,
    bigIntToGroups,
    multiplyGroupsByRepunit,
    multiplyGroups,
    multiplyGroupsByDigit,
    groupsToBigInt,
} from './multiply.js'

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
        console.error(`  ${err.message}`)
    }
}

// deterministic PRNG so failures reproduce
let seed = 0x2f6e2b1
const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
}
const randInt = (n) => Math.floor(rand() * n)

/** random non-negative bigint with up to `maxDigits` digits in `base` */
function randBig(maxDigits, base) {
    const digits = 1 + randInt(maxDigits)
    let value = 0n
    for (let i = 0; i < digits; i++) value = value * base + BigInt(randInt(Number(base)))
    return value
}

const BASES = [2n, 3n, 7n, 10n, 12n, 16n, 100n, 256n]

// ---------------------------------------------------------------------------
// conversions
// ---------------------------------------------------------------------------

test('bigIntToGroups / groupsToBigInt round-trip', () => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const value = randBig(60, base)
            assert.equal(groupsToBigInt(bigIntToGroups(value, base), base), value)
        }
    }
})

test('bigIntToGroups rejects negatives', () => {
    assert.throws(() => bigIntToGroups(-1n, 10n), RangeError)
})

// ---------------------------------------------------------------------------
// primitives vs BigInt
// ---------------------------------------------------------------------------

test('multiplyGroupsByDigit vs BigInt', () => {
    for (const base of BASES) {
        for (let i = 0; i < 300; i++) {
            const a = randBig(80, base)
            const d = BigInt(randInt(Number(base)))
            assert.equal(
                groupsToBigInt(multiplyGroupsByDigit(bigIntToGroups(a, base), d, base), base),
                a * d,
                `base ${base}: ${a} * ${d}`,
            )
        }
    }
})

test('addGroups vs BigInt', () => {
    for (const base of BASES) {
        for (let i = 0; i < 300; i++) {
            const a = randBig(80, base)
            const b = randBig(80, base)
            assert.equal(
                groupsToBigInt(addGroups(bigIntToGroups(a, base), bigIntToGroups(b, base), base), base),
                a + b,
                `base ${base}: ${a} + ${b}`,
            )
        }
    }
})

test('multiplyGroupsByRepunit vs BigInt', () => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const a = randBig(50, base)
            const c = BigInt(1 + randInt(40))
            const repunit = (base ** c - 1n) / (base - 1n === 0n ? 1n : base - 1n)
            const expected = base === 2n ? a * ((1n << c) - 1n) : a * repunit
            assert.equal(
                groupsToBigInt(multiplyGroupsByRepunit(bigIntToGroups(a, base), c, base, 1_000_000n), base),
                expected,
                `base ${base}: ${a} * R(${c})`,
            )
        }
    }
})

test('multiplyGroups vs BigInt', () => {
    for (const base of BASES) {
        for (let i = 0; i < 400; i++) {
            const a = randBig(70, base)
            const b = randBig(70, base)
            assert.equal(
                groupsToBigInt(multiplyGroups(bigIntToGroups(a, base), bigIntToGroups(b, base), base), base),
                a * b,
                `base ${base}: ${a} * ${b}`,
            )
        }
    }
})

// ---------------------------------------------------------------------------
// HugeInt.prototype
// ---------------------------------------------------------------------------

test('HugeInt#multiply fast path vs BigInt', () => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const a = randBig(60, base)
            const b = randBig(60, base)
            assert.equal(new HugeInt(a, base).multiply(new HugeInt(b, base)).value, a * b)
            assert.equal(new HugeInt(a, base).multiply(b).value, a * b)
        }
    }
})

test('HugeInt#multiply digit-group path agrees with fast path', () => {
    const saved = HugeInt.maxBigIntBits
    HugeInt.maxBigIntBits = 1n
    try {
        for (const base of BASES) {
            for (let i = 0; i < 150; i++) {
                const a = randBig(50, base)
                const b = randBig(50, base)
                assert.equal(new HugeInt(a, base).multiply(new HugeInt(b, base)).value, a * b, `base ${base}: ${a}*${b}`)
            }
        }
    } finally {
        HugeInt.maxBigIntBits = saved
    }
})

test('HugeInt#add vs BigInt', () => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const a = randBig(60, base)
            const b = randBig(60, base)
            assert.equal(new HugeInt(a, base).add(new HugeInt(b, base)).value, a + b)
        }
    }
})

test('HugeInt#multiplyByDigit / #shiftLeft vs BigInt', () => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const a = randBig(60, base)
            const d = BigInt(randInt(Number(base)))
            const k = BigInt(randInt(20))
            assert.equal(new HugeInt(a, base).multiplyByDigit(d).value, a * d)
            assert.equal(new HugeInt(a, base).shiftLeft(k).value, a * base ** k)
        }
    }
})

test('zero and identity', () => {
    assert.equal(new HugeInt(0n, 10n).multiply(12345n).value, 0n)
    assert.equal(new HugeInt(999n, 10n).multiply(0n).value, 0n)
    assert.equal(new HugeInt(999n, 10n).multiply(1n).value, 999n)
    assert.ok(new HugeInt(0n, 10n).isZero())
    assert.ok(!new HugeInt(1n, 10n).isZero())
})

test('base mismatch throws', () => {
    assert.throws(() => new HugeInt(5n, 10n).multiply(new HugeInt(5n, 16n)), /Base is incompatible/)
})

// ---------------------------------------------------------------------------
// scale BigInt cannot reach
// ---------------------------------------------------------------------------

const HUGE = 10n ** 15n

test('multiplyByDigit on a 10^15-digit group stays one group', () => {
    const n = HugeInt.fromGroups([[3n, HUGE]], 10n) // value 333…3  (10^15 threes)
    n.multiplyByDigit(2n)
    assert.equal(n.cellsLength, 1)
    assert.equal(n.firstCell.digit, 6n)
    assert.equal(n.firstCell.count, HUGE)
})

test('add on 10^15-digit groups is instant and exact', () => {
    const n = HugeInt.fromGroups([[1n, HUGE]], 10n)
    n.add(HugeInt.fromGroups([[1n, HUGE]], 10n))
    assert.equal(n.cellsLength, 1)
    assert.equal(n.firstCell.digit, 2n)
    assert.equal(n.firstCell.count, HUGE)
})

test('R(3) × R(10^15) has the closed-form 1 2 3…3 2 1 shape', () => {
    // 111 × 111…1  =  123…321 with the middle 3 repeated (b - a + 1) times
    const result = HugeInt.fromGroups([[1n, 3n]], 10n).multiply(HugeInt.fromGroups([[1n, HUGE]], 10n))
    const groups = [...result].map((cell) => [cell.digit, cell.count]) // LSB-first
    assert.deepEqual(groups, [[1n, 1n], [2n, 1n], [3n, HUGE - 2n], [2n, 1n], [1n, 1n]])
})

test('R(10^15) squared cannot stay compressed → BudgetExceededError', () => {
    const r = () => HugeInt.fromGroups([[1n, HUGE]], 10n)
    assert.throws(() => r().multiply(r()), BudgetExceededError)
})

test('huge group × short repunit stays representable', () => {
    // 3·R(c) × R(4): the group *sequence* is scale-invariant — only the middle
    // group's count grows with c. Compare digit sequences for c = 40 and c = 10^15.
    const smallGroups = multiplyGroupsByRepunit([[3n, 40n]], 4n, 10n, 1_000_000n)
    while (smallGroups.length > 1 && smallGroups[smallGroups.length - 1][0] === 0n) smallGroups.pop()
    const smallDigits = smallGroups.map(([digit]) => digit)
    const big = HugeInt.fromGroups([[3n, HUGE]], 10n).multiply(HugeInt.fromGroups([[1n, 4n]], 10n))
    const bigDigits = [...big].map((cell) => cell.digit)
    assert.deepEqual(bigDigits, smallDigits)
    assert.ok(big.cellsLength < 20)
})

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
