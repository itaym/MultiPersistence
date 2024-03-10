/**
 * @typedef FoundMessage
 * @property atRunTime { number }
 * @property calcIterations { number }
 * @property currentNoStr { string }
 * @property steps { number }
 */

/**
 *
 * @param startTime { number }
 * @param calcIterations { number }
 * @param steps { number }
 * @return { FoundMessage }
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