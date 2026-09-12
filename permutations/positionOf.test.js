/**
 * Tests for {@link positionOf} / {@link numberAt} / {@link advanceBy} — jumping to any point
 * in the canonical-number ordering by counting, instead of stepping through it.
 *
 *     node permutations/positionOf.test.js
 */

import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import advanceBy from './advanceBy.js'
import baseAccommodate from '#MultiplicativePersistence/BaseAccommodate/index.js'
import HugeIntEx from '#HugeIntEx/index.js'
import { numberAt, positionOf } from './positionOf.js'

process.normalizedEnv = {
    cache_idle_save_ms: 0,
    debug: true,
    memorize_cache_dir: tmpdir(),
}

let passed = 0
let failed = 0

/** @param {string} name
 * @param {() => void} fn
 */
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

/**
 * Real search stepping (`addOneToSorted` + `baseAccommodate`), the slow oracle `advanceBy`
 * is checked against.
 *
 * @param {BigInt} startValue
 * @param {BigInt} base
 * @param {BigInt} targetIterations
 * @returns {BigInt}
 */
const bruteForceAdvance = (startValue, base, targetIterations) => {
    const currentNo = new HugeIntEx(startValue, base)
    const createPermutations = baseAccommodate(base)
    let calcIterations = 0n

    while (calcIterations < targetIterations) {
        currentNo.addOneToSorted()
        calcIterations += 1n + createPermutations(currentNo)
    }

    return currentNo.value
}

test('positionOf: known base-6 single-digit values', () => {
    assert.equal(positionOf(2n, 6n), 0n)
    assert.equal(positionOf(3n, 6n), 1n)
    assert.equal(positionOf(4n, 6n), 2n)
    assert.equal(positionOf(5n, 6n), 3n)
})

test('positionOf: first two-digit base-6 number follows the four single-digit ones', () => {
    assert.equal(positionOf(14n, 6n), 4n) // "22" in base 6 = 2*6+2 = 14
})

test('numberAt: inverse of the known base-6 cases', () => {
    assert.equal(numberAt(0n, 6n), 2n)
    assert.equal(numberAt(1n, 6n), 3n)
    assert.equal(numberAt(4n, 6n), 14n)
})

test('positionOf / numberAt / advanceBy match real stepping, at every real calcIterations value', () => {
    for (const base of [6n, 8n, 9n, 10n, 12n]) {
        const seed = 2n * base + 2n // "22"
        const seedPosition = positionOf(seed, base)
        const currentNo = new HugeIntEx(seed, base)
        const createPermutations = baseAccommodate(base)
        let calcIterations = 0n

        for (let step = 0n; step < 500n; step++) {
            currentNo.addOneToSorted()
            calcIterations += 1n + createPermutations(currentNo)

            const expectedPosition = seedPosition + calcIterations
            assert.equal(positionOf(currentNo.value, base), expectedPosition,
                `base ${base}, step ${step}: positionOf mismatch`)
            assert.equal(numberAt(expectedPosition, base), currentNo.value,
                `base ${base}, step ${step}: numberAt mismatch`)
            assert.equal(advanceBy(seed, base, calcIterations), currentNo.value,
                `base ${base}, step ${step}: advanceBy mismatch`)
        }
    }
})

test('advanceBy can land on a number a real run would have skipped over — that is intended', () => {
    // base 6, seed "22": addOneToSorted alone gives "23", but baseAccommodate immediately
    // promotes it to "24" (a 2-cell exists), crediting 1 skipped number to calcIterations.
    // So the real run jumps from calcIterations 0 straight to 2, never visiting rank 1 ("23")
    // on its own — but advanceBy still resolves rank 1 to "23", since a segment boundary is
    // just a plain number, not something that needs to have been individually checked.
    assert.equal(bruteForceAdvance(14n, 6n, 1n), 16n) // real run: seed -> "24" (rank 2)
    assert.equal(advanceBy(14n, 6n, 1n), 15n) // exact rank 1 -> "23", the skipped number
    assert.equal(advanceBy(14n, 6n, 2n), 16n) // exact rank 2 -> "24", matches the real run
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
