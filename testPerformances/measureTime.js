/** @typedef {(...args: any[]) => any} AnyFn  any function; args and return value pass through untouched */

/**
 * @typedef {Object} TimingStats
 * @property {number} averageDuration  mean ms per call, scaled by `multiplyBy`
 * @property {number} count            calls since the last reset
 * @property {number} perSecond        throughput, 1000 / averageDuration
 * @property {number} totalDuration    raw accumulated ms
 */

/**
 * Wraps `fn` in a timing harness that accumulates wall-clock duration and a
 * call count across every invocation.
 *
 * The returned function is a drop-in replacement for `fn`: it forwards all
 * arguments, returns `fn`'s result unchanged, and on the side times each call
 * with `performance.now()` and adds it to a running total. Two helpers hang off
 * it: `.reset()` to zero the counters and `.stats()` to read them back.
 *
 * @param {AnyFn} fn        function to measure
 * @returns {MeasuredFn}    wrapper around `fn` carrying `.reset()` and `.stats()`
 */
function measureTime(fn) {

    let count = 0            // number of times callFn has run since the last reset
    let totalDuration = 0    // summed (endTime - startTime), in milliseconds
    let endTime = 0          // scratch: end of the most recent call
    let result = null        // scratch: return value of the most recent call
    let startTime = 0        // scratch: start of the most recent call

    /**
     * Timed pass-through to `fn`.
     *
     * @param {...any} args  forwarded verbatim to `fn`
     * @returns {any}        whatever `fn` returns
     */
    function callFn(...args) {
        count++
        startTime = performance.now()
        result = fn(...args)
        endTime = performance.now()
        totalDuration += endTime - startTime
        return result
    }

    /**
     * Zeroes the call count and accumulated duration. Use after a warm-up phase
     * so it doesn't pollute the measured numbers.
     *
     * @returns {void}
     */
    callFn.reset = function() {
        count = 0
        totalDuration = 0
        endTime = 0
        result = null
        startTime = 0
    }

    /**
     * Snapshot of the counters since the last reset.
     *
     * @param {number} [multiplyBy=1]  scales `averageDuration`/`perSecond`, e.g. when one call does `multiplyBy` ops
     * @returns {TimingStats}
     */
    callFn.stats = function(multiplyBy) {
        multiplyBy ??= 1
        let averageDuration = totalDuration / count * multiplyBy
        return {
            averageDuration,
            count,
            perSecond: 1_000 / averageDuration,
            totalDuration: totalDuration,
        }
    }
    return callFn
}

/**
 * A timed wrapper produced by {@link measureTime}. Call it exactly like the
 * original function; `.reset()` and `.stats()` manage the timing counters.
 *
 * @typedef {AnyFn} MeasuredFn
 * @property {() => void} reset                             zero the call count and accumulated duration
 * @property {(multiplyBy?: number) => TimingStats} stats   read the counters since the last reset
 */

export default measureTime