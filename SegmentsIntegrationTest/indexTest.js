/**
 * Real, end-to-end check that segmenting a range and merging the results gives the same
 * substantive findings as running that same range continuously:
 *
 *   - segment A: 0 -> x, exactly 100,000,000 calcIterations
 *   - segment B: x -> y, another 100,000,000 calcIterations
 *   - segment C: 0 -> y, run continuously (same total range as A + B)
 *   - merge(A, B) must match C, aside from run-position metadata (timing, iteration index)
 *     that legitimately differs between a segmented and a continuous run.
 *
 *     node SegmentsIntegrationTest/indexTest.js
 */

import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { setComputationState } from '#Config/computationStateIO.js'
import mergeSegments from './mergeSegments.js'
import runSegment from './runSegment.js'

process.normalizedEnv = {
    cache_idle_save_ms: 0,
    debug: false,
    memorize_cache_dir: tmpdir(),
}

const BASE = 10n
const SEGMENT_ITERATIONS = 100_000_000n

/**
 * Deep-clones a step-bucket map, dropping fields that reflect *when* in a run something
 * happened (`atRunTime`, `iteration`) rather than *what* was found — those legitimately
 * differ between a segmented and a continuous run of the same range.
 *
 * @param {Object<string, Object>} steps
 * @returns {Object<string, Object>}
 */
const stripStepMetadata = (steps) => {
    const stripped = {}
    for (const [key, bucket] of Object.entries(steps)) {
        stripped[key] = { ...bucket }
        delete stripped[key].atRunTime
        delete stripped[key].iteration
    }
    return stripped
}

/**
 * Same idea for `number_lengths`, additionally dropping `time` (wall-clock duration).
 *
 * @param {NumberLengths} numberLengths
 * @returns {NumberLengths}
 */
const stripNumberLengthsMetadata = (numberLengths) => {
    const stripped = {}
    for (const [length, stats] of Object.entries(numberLengths)) {
        stripped[length] = { found: stats.found, steps: stripStepMetadata(stats.steps) }
    }
    return stripped
}

/**
 * @param {ComputationState} state
 * @returns {object}
 */
const forComparison = (state) => ({
    iterations: { calculated: state.iterations.calculated, count: state.iterations.count },
    last_number: state.last_number,
    number_lengths: stripNumberLengthsMetadata(state.number_lengths),
    steps: stripStepMetadata(state.steps),
})

console.log(`base ${BASE}, ${SEGMENT_ITERATIONS} iterations per segment`)

console.time('segment A')
const segmentA = runSegment(0n, BASE, SEGMENT_ITERATIONS)
console.timeEnd('segment A')
console.log(`  -> x = ${segmentA.last_number} (${segmentA.iterations.calculated} calcIterations)`)
process.normalizedEnv.results_file = 'segTestA'
await setComputationState(segmentA, BASE)

console.time('segment B')
const segmentB = runSegment(segmentA.last_number, BASE, SEGMENT_ITERATIONS)
console.timeEnd('segment B')
console.log(`  -> y = ${segmentB.last_number} (${segmentB.iterations.calculated} calcIterations)`)
process.normalizedEnv.results_file = 'segTestB'
await setComputationState(segmentB, BASE)

const merged = mergeSegments(segmentA, segmentB)
const totalIterations = segmentA.iterations.count + segmentB.iterations.count

console.time('segment C (continuous)')
const segmentC = runSegment(0n, BASE, totalIterations)
console.timeEnd('segment C (continuous)')
console.log(`  -> ${segmentC.last_number} (${segmentC.iterations.calculated} calcIterations)`)
process.normalizedEnv.results_file = 'segTestC'
await setComputationState(segmentC, BASE)

assert.equal(merged.last_number, segmentC.last_number, 'merged(A,B) and C ended on different numbers')
assert.deepStrictEqual(forComparison(merged), forComparison(segmentC), 'merged(A,B) and C substantively disagree')

console.log('\n✓ merge(A, B) matches the continuous run C')
