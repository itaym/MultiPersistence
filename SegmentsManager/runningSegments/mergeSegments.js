/**
 * Sum of two `{ key: count }` histograms.
 *
 * @param {Object<string, number>} a
 * @param {Object<string, number>} b
 * @returns {Object<string, number>}
 */
const mergeHistogram = (a, b) => {
    const merged = {}
    for (const key in a) merged[key] = a[key]
    for (const key in b) merged[key] = (merged[key] || 0) + b[key]
    return merged
}

/**
 * Merges a step bucket of a lower segment (`a`) and a higher one (`b`).
 *
 * @param {TypeStep} [a]
 * @param {TypeStep} [b]
 * @returns {TypeStep}
 */
const mergeStepBucket = (a, b) => {
    if (!a) return b
    if (!b) return a
    return {
        additionSum: a.additionSum + b.additionSum,
        additionSums: mergeHistogram(a.additionSums, b.additionSums),
        atRunTime: a.atRunTime,
        combinations: a.combinations + b.combinations,
        count: a.count + b.count,
        first: a.first,
        iteration: a.iteration,
        last: b.last,
        multiplySum: a.multiplySum + b.multiplySum,
        productLengths: mergeHistogram(a.productLengths, b.productLengths),
        step: a.step,
    }
}

/**
 * Merges a per-length step bucket of a lower segment (`a`) and a higher one (`b`).
 *
 * @param {LengthStepBucket} [a]
 * @param {LengthStepBucket} [b]
 * @returns {LengthStepBucket}
 */
const mergeLengthStepBucket = (a, b) => {
    if (!a) return b
    if (!b) return a
    return {
        additionSum: a.additionSum + b.additionSum,
        additionSums: mergeHistogram(a.additionSums, b.additionSums),
        combinations: a.combinations + b.combinations,
        count: a.count + b.count,
        first: a.first,
        last: b.last,
        multiplySum: a.multiplySum + b.multiplySum,
        productLengths: mergeHistogram(a.productLengths, b.productLengths),
    }
}

/**
 * Merges every key of two bucket maps, with `mergeFn` for keys in both.
 *
 * @param {Object<string, Object>} a
 * @param {Object<string, Object>} b
 * @param {(a: Object, b: Object) => Object} mergeFn
 * @returns {Object<string, Object>}
 */
const mergeBucketMap = (a, b, mergeFn) => {
    const merged = {}
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        merged[key] = mergeFn(a[key], b[key])
    }
    return merged
}

/**
 * Merges the `number_lengths` of a lower segment (`a`) and a higher one (`b`).
 *
 * @param {NumberLengths} a
 * @param {NumberLengths} b
 * @returns {NumberLengths}
 */
const mergeNumberLengths = (a, b) => mergeBucketMap(a, b, (lengthA, lengthB) => {
    if (!lengthA) return lengthB
    if (!lengthB) return lengthA
    return {
        found: lengthA.found + lengthB.found,
        steps: mergeBucketMap(lengthA.steps, lengthB.steps, mergeLengthStepBucket),
        time: lengthA.time + lengthB.time,
    }
})

/**
 * Merges two adjacent segments' states as if run continuously: counts add, `first` from `lower`, `last` from `higher`.
 *
 * @param {ComputationState} higher the later segment
 * @param {ComputationState} lower the earlier segment
 * @returns {ComputationState}
 */
const mergeSegments = (higher, lower) => ({
    iterations: {
        actual: lower.iterations.actual + higher.iterations.actual,
        count: lower.iterations.count + higher.iterations.count,
        found_nothing: lower.iterations.found_nothing + higher.iterations.found_nothing,
        found_nothing_break_at: higher.iterations.found_nothing_break_at,
    },
    last_number: higher.last_number,
    number_lengths: mergeNumberLengths(lower.number_lengths, higher.number_lengths),
    pseudoGoal: higher.pseudoGoal,
    range_start: lower.range_start,
    steps: mergeBucketMap(lower.steps, higher.steps, mergeStepBucket),
    up_time: lower.up_time + higher.up_time,
})

export default mergeSegments
