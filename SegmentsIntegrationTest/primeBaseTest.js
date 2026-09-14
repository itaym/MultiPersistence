/**
 * Real, standalone check that runSegment matches the combinatorial prediction for a prime
 * base — baseAccommodate has no skip-rules for prime bases, so calcIterations and
 * countIterations advance in lockstep and the end number is exactly predictable via
 * numberAt/positionOf, no ghost-number risk.
 *
 *     node SegmentsIntegrationTest/primeBaseTest.js
 */

import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { numberAt } from '#permutations/positionOf.js'
import runSegment from './runSegment.js'

process.normalizedEnv = {
    cache_idle_save_ms: 0,
    debug: false,
    memorize_cache_dir: tmpdir(),
}

const BASE = 11n
const ITERATIONS = 1000n

const segment = runSegment(0n, BASE, ITERATIONS)
const expected = numberAt(ITERATIONS - 2n, BASE)

assert.equal(segment.last_number, expected, 'runSegment last_number does not match the combinatorial prediction')

console.log(`✓ base ${BASE}: last_number after ${ITERATIONS} iterations matches numberAt prediction (${expected})`)
