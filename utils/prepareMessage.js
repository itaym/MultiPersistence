/**
 * Builds a `found` message for the current number (`this`).
 *
 * @this {HugeIntEx}
 * @param {bigint} actualIterations canonical numbers passed so far
 * @param {ReduceResults} reduceResults
 * @param {number} startTime run start, in milliseconds
 * @returns {FoundMessage}
 */
const prepareMessage = function (actualIterations, reduceResults, startTime) {
    // Copy the four ReduceResults fields by name for performance.
    return {
        actualIterations,
        additionSum: reduceResults.additionSum,
        atRunTime: Date.now() - startTime,
        currentNoStr: this.toString(),
        multiplySum: reduceResults.multiplySum,
        next: null,
        productLength: reduceResults.productLength,
        steps: reduceResults.steps,
    }
}

export default prepareMessage
