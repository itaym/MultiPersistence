/** Checks that merging two consecutive segments equals one continuous run over both. */
import { saveComputationState } from '#Config/computationStateIO.js'
import mergeSegments from '#runningSegments/mergeSegments.js'
import runSegment from './runSegment.js'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'

process.normalizedEnv = {
    cache_idle_save_ms: 0,
    debug: false,
    memorize_cache_dir: tmpdir(),
}

const BASE = 10n
const SEGMENT_ITERATIONS = 100_000_000n

/**
 * Copy of `steps` without the run-position fields.
 *
 * @param {Object<string, TypeStep>} steps
 * @returns {Object<string, StrippedStep>}
 */
const stripStepMetadata = steps => {
    const stripped = {}
    for (const [key, bucket] of Object.entries(steps)) {
        stripped[key] = { ...bucket }
        delete stripped[key].atRunTime
        delete stripped[key].iteration
    }
    return stripped
}

/**
 * Copy of `numberLengths` without the run-position fields.
 *
 * @param {NumberLengths} numberLengths
 * @returns {Object<string, StrippedLength>}
 */
const stripNumberLengthsMetadata = numberLengths => {
    const stripped = {}
    for (const [length, stats] of Object.entries(numberLengths)) {
        stripped[length] = { found: stats.found, steps: stripStepMetadata(stats.steps) }
    }
    return stripped
}

/**
 * The fields that must match between a merged and a continuous run.
 *
 * @param {ComputationState} state
 * @returns {ComparableState}
 */
const forComparison = state => ({
    iterations: { actual: state.iterations.actual, count: state.iterations.count },
    last_number: state.last_number,
    number_lengths: stripNumberLengthsMetadata(state.number_lengths),
    steps: stripStepMetadata(state.steps),
})

console.log(`base ${BASE}, ${SEGMENT_ITERATIONS} iterations per segment`)

console.time('segment A')
const segmentA = runSegment(BASE, SEGMENT_ITERATIONS, 0n)
console.timeEnd('segment A')
console.log(`  -> x = ${segmentA.last_number} (${segmentA.iterations.actual} actualIterations)`)
process.normalizedEnv.results_file = 'segTestA'
await saveComputationState(BASE, segmentA)

console.time('segment B')
const segmentB = runSegment(BASE, SEGMENT_ITERATIONS, segmentA.last_number)
console.timeEnd('segment B')
console.log(`  -> y = ${segmentB.last_number} (${segmentB.iterations.actual} actualIterations)`)
process.normalizedEnv.results_file = 'segTestB'
await saveComputationState(BASE, segmentB)

const merged = mergeSegments(segmentB, segmentA)
const pseudoGoalNumberOfIterations = segmentA.iterations.count + segmentB.iterations.count

console.time('segment C (continuous)')
const segmentC = runSegment(BASE, pseudoGoalNumberOfIterations, 0n)
console.timeEnd('segment C (continuous)')
console.log(`  -> ${segmentC.last_number} (${segmentC.iterations.actual} actualIterations)`)
process.normalizedEnv.results_file = 'segTestC'
await saveComputationState(BASE, segmentC)

assert.equal(merged.last_number, segmentC.last_number, 'merged(A,B) and C ended on different numbers')
assert.deepStrictEqual(forComparison(merged), forComparison(segmentC), 'merged(A,B) and C substantively disagree')

console.log('\n✓ merge(A, B) matches the continuous run C')
