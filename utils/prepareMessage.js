/**
 * @typedef {Object} FoundMessage
 * @property {number} atRunTime
 *     Milliseconds elapsed since the search session started.
 *
 * @property {number} calcIterations
 *     Number of calculated iterations performed at the moment the message was created.
 *
 * @property {string} currentNoStr
 *     String representation of the HugeInt that produced this message.
 *
 * @property {number} steps
 *     Multiplicative persistence steps required to reach a single digit.
 *
 * @property {FoundMessage|null} [next]
 *     Optional link to the next message in a chain (initially null).
 */

/**
 * Create a `FoundMessage` describing the current persistence result.
 *
 * This function must be invoked with a HugeInt instance as its `this` context.
 * It converts the HugeInt to a string, computes the elapsed runtime, and
 * packages all relevant metadata into a structured message object.
 *
 * @param {number} startTime
 *     The timestamp (ms) when the search session began.
 *
 * @param {number} calcIterations
 *     Number of calculated iterations performed so far.
 *
 * @param {number} steps
 *     Number of multiplicative‑persistence steps taken to reach a single digit.
 *
 * @returns {FoundMessage}
 *     A structured message containing timing, iteration count, the number string,
 *     and persistence depth.
 */
const prepareMessage = function (startTime, calcIterations, steps) {
    const currentNoStr = this.toString()
    return {
        atRunTime: Date.now() - startTime,
        calcIterations,
        currentNoStr: currentNoStr,
        next: null,
        steps,
    }
}

export default prepareMessage