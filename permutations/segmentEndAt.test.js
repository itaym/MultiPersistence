/**
 * Tests for {@link segmentEndAt} — the end boundary of a segment that checks exactly
 * `count` numbers, `startAt` included.
 *
 *     node permutations/segmentEndAt.test.js
 */

import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import advanceBy from './advanceBy.js'
import baseAccommodate from '#MultiplicativePersistence/BaseAccommodate/index.js'
import HugeIntEx from '#HugeIntEx/index.js'
import segmentEndAt from './segmentEndAt.js'

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

test('a 1-number segment ends where it starts', () => {
    for (const base of [6n, 8n, 10n]) {
        const startAt = 2n * base + 2n
        assert.equal(segmentEndAt(startAt, base, 1n), startAt)
    }
})

test('matches advanceBy with count - 1', () => {
    const base = 10n
    const startAt = 22n
    assert.equal(segmentEndAt(startAt, base, 5n), advanceBy(startAt, base, 4n))
})

test('a segment of count numbers checks exactly count numbers, startAt included', () => {
    for (const base of [6n, 8n, 9n, 10n]) {
        const startAt = 2n * base + 2n
        const createPermutations = baseAccommodate(base)
        const currentNo = new HugeIntEx(startAt, base)
        let checked = 1n // startAt itself is check #1

        for (let step = 0n; step < 400n; step++) {
            currentNo.addOneToSorted()
            checked += 1n + createPermutations(currentNo)

            // checked is exactly how many numbers a real run has checked by now (startAt
            // included), so a `checked`-sized segment must end exactly on currentNo.
            assert.equal(segmentEndAt(startAt, base, checked), currentNo.value,
                `base ${base}, step ${step}`)
        }
    }
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
