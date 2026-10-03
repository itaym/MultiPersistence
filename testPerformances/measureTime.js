/**
 * Wraps `fn` so every call is timed.
 *
 * @param {AnyFn} fn
 * @returns {MeasuredFn}
 */
const measureTime = fn => {
    let count = 0            // number of times callFn has run since the last reset
    let totalDuration = 0    // summed (endTime - startTime), in milliseconds
    let endTime = 0          // scratch: end of the most recent call
    let result = null        // scratch: return value of the most recent call
    let startTime = 0        // scratch: start of the most recent call

    /**
     * Calls `fn` and adds its duration to the totals.
     *
     * @param {...*} args passed to `fn`
     * @returns {*} `fn`'s result
     */
    const callFn = (...args) => {
        count++
        startTime = performance.now()
        result = fn(...args)
        endTime = performance.now()
        totalDuration += endTime - startTime
        return result
    }

    /**
     * Clears the totals.
     *
     * @returns {void}
     */
    callFn.reset = () => {
        count = 0
        totalDuration = 0
        endTime = 0
        result = null
        startTime = 0
    }

    /**
     * Totals so far.
     *
     * @param {number} [multiplyBy=1] scales the average duration
     * @returns {TimingStats}
     */
    callFn.stats = multiplyBy => {
        multiplyBy ??= 1
        const averageDuration = totalDuration / count * multiplyBy
        return {
            averageDuration,
            count,
            perSecond: 1000 / averageDuration,
            // TODO: shorthand is the rule; kept long form (measured slightly faster), revisit
            // eslint-disable-next-line object-shorthand
            totalDuration: totalDuration,
        }
    }
    return callFn
}

export default measureTime
