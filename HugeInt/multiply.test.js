/** Tests for the digit-group arithmetic in multiply.js and HugeInt's arithmetic on top of it. */
import {
    BudgetExceededError,
    HugeInt,
} from './HugeInt.js'
import {
    addGroups,
    bigIntToGroups,
    groupsToBigInt,
    multiplyGroups,
    multiplyGroupsByDigit,
    multiplyGroupsByRepunit,
} from './multiply.js'
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
        console.error(`  ${err.message}`)
    }
}

// deterministic PRNG so failures reproduce
let seed = 0x2_f6_e2_b1

/**
 * Deterministic pseudo-random number in [0, 1).
 *
 * @returns {number}
 */
const rand = () => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7f_ff_ff_ff
    return seed / 0x7f_ff_ff_ff
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
    const digits = 1 + randInt(maxDigits)
    let value = 0n
    for (let i = 0; i < digits; i++) value = value * base + BigInt(randInt(Number(base)))
    return value
}

const BASES = [2n, 3n, 7n, 10n, 12n, 16n, 100n, 256n]

// ---------------------------------------------------------------------------
// conversions
// ---------------------------------------------------------------------------

test(() => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const value = randBig(base, 60)
            assert.equal(groupsToBigInt(base, bigIntToGroups(base, value)), value)
        }
    }
}, 'bigIntToGroups / groupsToBigInt round-trip')

test(() => {
    assert.throws(() => bigIntToGroups(10n, -1n), RangeError)
}, 'bigIntToGroups rejects negatives')

// ---------------------------------------------------------------------------
// primitives vs BigInt
// ---------------------------------------------------------------------------

test(() => {
    for (const base of BASES) {
        for (let i = 0; i < 300; i++) {
            const a = randBig(base, 80)
            const d = BigInt(randInt(Number(base)))
            assert.equal(
                groupsToBigInt(base, multiplyGroupsByDigit(base, d, bigIntToGroups(base, a))),
                a * d,
                `base ${base}: ${a} * ${d}`,
            )
        }
    }
}, 'multiplyGroupsByDigit vs BigInt')

test(() => {
    for (const base of BASES) {
        for (let i = 0; i < 300; i++) {
            const a = randBig(base, 80)
            const b = randBig(base, 80)
            assert.equal(
                groupsToBigInt(base, addGroups(base, bigIntToGroups(base, a), bigIntToGroups(base, b))),
                a + b,
                `base ${base}: ${a} + ${b}`,
            )
        }
    }
}, 'addGroups vs BigInt')

test(() => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const a = randBig(base, 50)
            const c = BigInt(1 + randInt(40))
            const repunit = (base ** c - 1n) / (base - 1n === 0n ? 1n : base - 1n)
            const expected = base === 2n ? a * ((1n << c) - 1n) : a * repunit
            assert.equal(
                groupsToBigInt(base, multiplyGroupsByRepunit(base, bigIntToGroups(base, a), 1_000_000n, c)),
                expected,
                `base ${base}: ${a} * R(${c})`,
            )
        }
    }
}, 'multiplyGroupsByRepunit vs BigInt')

test(() => {
    for (const base of BASES) {
        for (let i = 0; i < 400; i++) {
            const a = randBig(base, 70)
            const b = randBig(base, 70)
            assert.equal(
                groupsToBigInt(base, multiplyGroups(base, bigIntToGroups(base, a), bigIntToGroups(base, b))),
                a * b,
                `base ${base}: ${a} * ${b}`,
            )
        }
    }
}, 'multiplyGroups vs BigInt')

// ---------------------------------------------------------------------------
// HugeInt.prototype
// ---------------------------------------------------------------------------

test(() => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const a = randBig(base, 60)
            const b = randBig(base, 60)
            assert.equal(new HugeInt(base, undefined, a).multiply(new HugeInt(base, undefined, b)).value, a * b)
            assert.equal(new HugeInt(base, undefined, a).multiply(b).value, a * b)
        }
    }
}, 'HugeInt#multiply fast path vs BigInt')

test(() => {
    const saved = HugeInt.maxBigIntBits
    HugeInt.maxBigIntBits = 1n
    try {
        for (const base of BASES) {
            for (let i = 0; i < 150; i++) {
                const a = randBig(base, 50)
                const b = randBig(base, 50)
                assert.equal(
                    new HugeInt(base, undefined, a).multiply(new HugeInt(base, undefined, b)).value,
                    a * b,
                    `base ${base}: ${a}*${b}`,
                )
            }
        }
    } finally {
        HugeInt.maxBigIntBits = saved
    }
}, 'HugeInt#multiply digit-group path agrees with fast path')

test(() => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const a = randBig(base, 60)
            const b = randBig(base, 60)
            assert.equal(new HugeInt(base, undefined, a).add(new HugeInt(base, undefined, b)).value, a + b)
        }
    }
}, 'HugeInt#add vs BigInt')

test(() => {
    for (const base of BASES) {
        for (let i = 0; i < 200; i++) {
            const a = randBig(base, 60)
            const d = BigInt(randInt(Number(base)))
            const k = BigInt(randInt(20))
            assert.equal(new HugeInt(base, undefined, a).multiplyByDigit(d).value, a * d)
            assert.equal(new HugeInt(base, undefined, a).shiftLeft(k).value, a * base ** k)
        }
    }
}, 'HugeInt#multiplyByDigit / #shiftLeft vs BigInt')

test(() => {
    assert.equal(new HugeInt(10n, undefined, 0n).multiply(12_345n).value, 0n)
    assert.equal(new HugeInt(10n, undefined, 999n).multiply(0n).value, 0n)
    assert.equal(new HugeInt(10n, undefined, 999n).multiply(1n).value, 999n)
    assert.ok(new HugeInt(10n, undefined, 0n).isZero())
    assert.ok(!new HugeInt(10n, undefined, 1n).isZero())
}, 'zero and identity')

test(() => {
    assert.throws(
        () => new HugeInt(10n, undefined, 5n).multiply(new HugeInt(16n, undefined, 5n)),
        /Base is incompatible/,
    )
}, 'base mismatch throws')

// ---------------------------------------------------------------------------
// scale BigInt cannot reach
// ---------------------------------------------------------------------------

const HUGE = 10n ** 15n

test(() => {
    const n = HugeInt.fromGroups([[3n, HUGE]], 10n) // value 333…3  (10^15 threes)
    n.multiplyByDigit(2n)
    assert.equal(n.cellsLength, 1)
    assert.equal(n.firstCell.digit, 6n)
    assert.equal(n.firstCell.count, HUGE)
}, 'multiplyByDigit on a 10^15-digit group stays one group')

test(() => {
    const n = HugeInt.fromGroups([[1n, HUGE]], 10n)
    n.add(HugeInt.fromGroups([[1n, HUGE]], 10n))
    assert.equal(n.cellsLength, 1)
    assert.equal(n.firstCell.digit, 2n)
    assert.equal(n.firstCell.count, HUGE)
}, 'add on 10^15-digit groups is instant and exact')

test(() => {
    // 111 × 111…1  =  123…321 with the middle 3 repeated (b - a + 1) times
    const result = HugeInt.fromGroups([[1n, 3n]], 10n).multiply(HugeInt.fromGroups([[1n, HUGE]], 10n))
    const groups = [...result].map(cell => [cell.digit, cell.count]) // LSB-first
    assert.deepEqual(groups, [[1n, 1n], [2n, 1n], [3n, HUGE - 2n], [2n, 1n], [1n, 1n]])
}, 'R(3) × R(10^15) has the closed-form 1 2 3…3 2 1 shape')

test(() => {
    /** @returns {HugeInt} one repeated `HUGE` times */
    const r = () => HugeInt.fromGroups([[1n, HUGE]], 10n)
    assert.throws(() => r().multiply(r()), BudgetExceededError)
}, 'R(10^15) squared cannot stay compressed → BudgetExceededError')

test(() => {
    // 3·R(c) × R(4): the group *sequence* is scale-invariant — only the middle
    // group's count grows with c. Compare digit sequences for c = 40 and c = 10^15.
    const smallGroups = multiplyGroupsByRepunit(10n, [[3n, 40n]], 1_000_000n, 4n)
    while (smallGroups.length > 1 && smallGroups[smallGroups.length - 1][0] === 0n) smallGroups.pop()
    const smallDigits = smallGroups.map(([digit]) => digit)
    const big = HugeInt.fromGroups([[3n, HUGE]], 10n).multiply(HugeInt.fromGroups([[1n, 4n]], 10n))
    const bigDigits = [...big].map(cell => cell.digit)
    assert.deepEqual(bigDigits, smallDigits)
    assert.ok(big.cellsLength < 20)
}, 'huge group × short repunit stays representable')

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
