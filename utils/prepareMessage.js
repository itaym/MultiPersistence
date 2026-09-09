/**
 * A single found number, ready to send to the worker. Carries the four
 * {@link ReduceResults} fields plus timing/identity fields.
 *
 * @typedef {Object} FoundMessage
 * @property {number} atRunTime - Milliseconds elapsed since the search session started.
 * @property {number} calcIterations - Calculated iterations at the moment the message was created.
 * @property {string} currentNoStr - String form of the HugeInt that produced this message.
 * @property {BigInt} additionSum - Sum of the number's digits.
 * @property {BigInt} multiplySum - Product of the number's digits (the step-1 result).
 * @property {number} productLength - Digit count of `multiplySum` in the current base.
 * @property {number} steps - Multiplicative persistence steps to reach a single digit.
 * @property {FoundMessage|null} [next] - Optional link to the next message in a chain (initially null).
 */

/**
 * Builds a `FoundMessage` for the current persistence result. Call with a HugeInt as `this`.
 *
 * @param {number} startTime timestamp (ms) when the search session began
 * @param {number} calcIterations calculated iterations so far
 * @param {ReduceResults} reduceResults the step-1 reduction fields to copy in
 * @returns {FoundMessage}
 */
const prepareMessage = function (startTime, calcIterations, reduceResults) {
    // Copy the four ReduceResults fields by name for performance.
    return {
        additionSum: reduceResults.additionSum,
        atRunTime: Date.now() - startTime,
        calcIterations,
        currentNoStr: this.toString(),
        multiplySum: reduceResults.multiplySum,
        next: null,
        productLength: reduceResults.productLength,
        steps: reduceResults.steps,
    }
}

export default prepareMessage