/** Tests for positionOf / numberAt / advanceBy. */
import baseAccommodate from '#BaseAccommodate/index.js'
import HugeIntEx from '#HugeIntEx/index.js'
import advanceBy from './advanceBy.js'
import {
    numberAt,
    positionOf,
} from './positionOf.js'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'

process.normalizedEnv = {
    cache_idle_save_ms: 0,
    debug: true,
    memorize_cache_dir: tmpdir(),
}

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
 * Number reached by a real search run of `realIterationsForSegment` canonical positions from `startValue`.
 *
 * @param {bigint} base
 * @param {bigint} realIterationsForSegment
 * @param {bigint} startValue
 * @returns {bigint}
 */
const bruteForceAdvance = (base, realIterationsForSegment, startValue) => {
    const currentNo = new HugeIntEx(base, undefined, startValue)
    const createPermutations = baseAccommodate(base)
    let actualIterations = 0n

    while (actualIterations < realIterationsForSegment) {
        currentNo.addOneToSorted()
        actualIterations += 1n + createPermutations(currentNo)
    }

    return currentNo.value
}

test(() => {
    assert.equal(positionOf(new HugeIntEx(6n, undefined, 2n)), 0n)
    assert.equal(positionOf(new HugeIntEx(6n, undefined, 3n)), 1n)
    assert.equal(positionOf(new HugeIntEx(6n, undefined, 4n)), 2n)
    assert.equal(positionOf(new HugeIntEx(6n, undefined, 5n)), 3n)
}, 'positionOf: known base-6 single-digit values')

test(() => {
    assert.equal(positionOf(new HugeIntEx(6n, undefined, 14n)), 4n) // "22" in base 6 = 2*6+2 = 14
}, 'positionOf: first two-digit base-6 number follows the four single-digit ones')

test(() => {
    assert.equal(numberAt(6n, 0n), 2n)
    assert.equal(numberAt(6n, 1n), 3n)
    assert.equal(numberAt(6n, 4n), 14n)
}, 'numberAt: inverse of the known base-6 cases')

test(() => {
    for (const base of [6n, 8n, 9n, 10n, 12n]) {
        const seed = 2n * base + 2n // "22"
        const seedPosition = positionOf(new HugeIntEx(base, undefined, seed))
        const currentNo = new HugeIntEx(base, undefined, seed)
        const createPermutations = baseAccommodate(base)
        let actualIterations = 0n

        for (let step = 0n; step < 500n; step++) {
            currentNo.addOneToSorted()
            actualIterations += 1n + createPermutations(currentNo)

            const expectedPosition = seedPosition + actualIterations
            assert.equal(positionOf(currentNo), expectedPosition,
                `base ${base}, step ${step}: positionOf mismatch`)
            assert.equal(numberAt(base, expectedPosition), currentNo.value,
                `base ${base}, step ${step}: numberAt mismatch`)
            assert.equal(advanceBy(base, actualIterations, seed), currentNo.value,
                `base ${base}, step ${step}: advanceBy mismatch`)
        }
    }
}, 'positionOf / numberAt / advanceBy match real stepping, at every real actualIterations value')

test(() => {
    // base 6, seed "22": addOneToSorted alone gives "23", but baseAccommodate immediately
    // promotes it to "24" (a 2-cell exists), crediting 1 skipped number to actualIterations.
    // So the real run jumps from actualIterations 0 straight to 2, never visiting rank 1 ("23")
    // on its own — but advanceBy still resolves rank 1 to "23", since a segment boundary is
    // just a plain number, not something that needs to have been individually checked.
    assert.equal(bruteForceAdvance(6n, 1n, 14n), 16n) // real run: seed -> "24" (rank 2)
    assert.equal(advanceBy(6n, 1n, 14n), 15n) // exact rank 1 -> "23", the skipped number
    assert.equal(advanceBy(6n, 2n, 14n), 16n) // exact rank 2 -> "24", matches the real run
}, 'advanceBy can land on a number a real run would have skipped over — that is intended')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
