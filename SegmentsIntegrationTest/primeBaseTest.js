/** Checks a prime-base segment's `last_number` against {@link numberAt}. */
import { numberAt } from '#permutations/positionOf.js'
import runSegment from './runSegment.js'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'

process.normalizedEnv = {
    cache_idle_save_ms: 0,
    debug: false,
    memorize_cache_dir: tmpdir(),
}

const BASE = 11n
const ITERATIONS = 1000n

const segment = runSegment(BASE, ITERATIONS, 0n)
const expected = numberAt(BASE, ITERATIONS - 2n)

assert.equal(segment.last_number, expected, 'runSegment last_number does not match the combinatorial prediction')

console.log(`✓ base ${BASE}: last_number after ${ITERATIONS} iterations matches numberAt prediction (${expected})`)
