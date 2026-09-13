/**
 * Merges a `{ key: count }` histogram from `a` and `b` into a new object.
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
 * Merges one top-level persistence-step bucket (`ComputationState.steps[step]`) from a lower
 * and a higher segment.
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
 * Merges one per-length-step bucket (`ComputationState.number_lengths[length].steps[step]`)
 * from a lower and a higher segment — same shape as {@link mergeStepBucket} minus the
 * run-position fields (`atRunTime` / `iteration` / `step`).
 *
 * @param {Object} [a]
 * @param {Object} [b]
 * @returns {Object}
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
 * Merges every key of two step-bucket maps, using `mergeFn` for keys present in both.
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
 * Merges `ComputationState.number_lengths` from a lower and a higher segment.
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
 * Merges two adjacent, already-run segments' stats into one, as if they'd been run
 * continuously: `first` comes from `lower`, `last` from `higher`, scalars add, histograms
 * merge by key. Assumes `lower` covers the numbers immediately before `higher`, no gap.
 *
 * @param {ComputationState} lower
 * @param {ComputationState} higher
 * @returns {ComputationState}
 */
const mergeSegments = (lower, higher) => ({
    base: lower.meta.base,
    iterations: {
        calculated: lower.iterations.calculated + higher.iterations.calculated,
        count: lower.iterations.count + higher.iterations.count,
        found_nothing: higher.iterations.found_nothing,
        found_nothing_break_at: higher.iterations.found_nothing_break_at,
    },
    last_number: higher.last_number,
    number_lengths: mergeNumberLengths(lower.number_lengths, higher.number_lengths),
    steps: mergeBucketMap(lower.steps, higher.steps, mergeStepBucket),
})

export default mergeSegments
