/** Tests for segmentEndAt. */
import baseAccommodate from '#BaseAccommodate/index.js'
import HugeIntEx from '#HugeIntEx/index.js'
import advanceBy from './advanceBy.js'
import segmentEndAt from './segmentEndAt.js'
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

test(() => {
    for (const base of [6n, 8n, 10n]) {
        const startAt = 2n * base + 2n
        assert.equal(segmentEndAt(base, 1n, startAt), startAt)
    }
}, 'a 1-number segment ends where it starts')

test(() => {
    const base = 10n
    const startAt = 22n
    assert.equal(segmentEndAt(base, 5n, startAt), advanceBy(base, 4n, startAt))
}, 'matches advanceBy with count - 1')

test(() => {
    for (const base of [6n, 8n, 9n, 10n]) {
        const startAt = 2n * base + 2n
        const createPermutations = baseAccommodate(base)
        const currentNo = new HugeIntEx(base, undefined, startAt)
        let checked = 1n // startAt itself is check #1

        for (let step = 0n; step < 400n; step++) {
            currentNo.addOneToSorted()
            checked += 1n + createPermutations(currentNo)

            // checked is exactly how many numbers a real run has checked by now (startAt
            // included), so a `checked`-sized segment must end exactly on currentNo.
            assert.equal(segmentEndAt(base, checked, startAt), currentNo.value,
                `base ${base}, step ${step}`)
        }
    }
}, 'a segment of count numbers checks exactly count numbers, startAt included')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
