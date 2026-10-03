import calcCellsArrFactorial from '#utils/calcCellsArrFactorial.js'
import factorial from '#utils/factorial.js'

/**
 * @param {bigint} additionSum
 * @param {bigint} multiplySum
 * @param {bigint} numberValue
 * @returns {FoundSnapshot}
 */
const snapshot = (additionSum, multiplySum, numberValue) => ({ additionSum, multiplySum, numberValue })

/**
 * Adds one to `hist[key]`.
 *
 * @param {Object<string, number>} hist
 * @param {string|bigint|number} key
 * @returns {void}
 */
const bumpHist = (hist, key) => {
    hist[key] = (hist[key] || 0) + 1
}

/**
 * Empty totals bucket of one persistence step.
 *
 * @param {number} atRunTime
 * @param {FoundSnapshot} first
 * @param {number} step
 * @returns {TypeStep}
 */
const createStepBucket = (atRunTime, first, step) => ({
    additionSum: 0n,
    additionSums: {},
    atRunTime,
    combinations: 0n,
    count: 0,
    first,
    iteration: 0,
    last: first,
    multiplySum: 0n,
    productLengths: {},
    step,
})

/**
 * Empty totals bucket of one persistence step within one number length.
 *
 * @param {FoundSnapshot} first
 * @returns {LengthStepBucket}
 */
const createLengthStepBucket = first => ({
    additionSum: 0n,
    additionSums: {},
    combinations: 0n,
    count: 0,
    first,
    last: first,
    multiplySum: 0n,
    productLengths: {},
})

/**
 * Run lengths of `currentNo`'s cells above 1, or `[1n]` when there are none.
 *
 * @param {HugeInt} currentNo
 * @returns {bigint[]}
 */
const createLengthsArray = currentNo => {
    const array = []

    for (let cell = currentNo.firstCell; cell; cell = cell.next) {
        if (cell.count !== 1n) array.push(cell.count)
    }

    if (array.length === 0) array.push(1n)
    return array
}

/**
 * Builds a recorder that adds each find to `computationState`'s step and number-length totals.
 *
 * @param {ComputationState} computationState updated in place
 * @returns {(currentNo: HugeInt, endTime: number, length: number, message: FoundMessage, startTime: number) => void}
 */
const createFoundRecorder = computationState => {
    const { number_lengths: numberLengths, steps: countSteps } = computationState

    /**
     * Records one find.
     *
     * @param {HugeInt} currentNo
     * @param {number} endTime
     * @param {number} length digits of `currentNo`
     * @param {FoundMessage} message
     * @param {number} startTime
     * @returns {void}
     */
    return (
        currentNo,
        endTime,
        length,
        { actualIterations, additionSum, atRunTime, multiplySum, productLength, steps },
        startTime,
    ) => {
        const numberValue = currentNo.value
        const combinations = factorial(BigInt(length)) / calcCellsArrFactorial(createLengthsArray(currentNo))

        // ---- totals for this persistence step ----
        const step = (countSteps[steps] ??= createStepBucket(
            atRunTime,
            snapshot(additionSum, multiplySum, numberValue),
            steps,
        ))

        step.additionSum += additionSum
        step.multiplySum += multiplySum
        step.combinations += combinations
        step.count++
        step.last = snapshot(additionSum, multiplySum, numberValue)
        step.atRunTime = atRunTime
        step.iteration = actualIterations
        bumpHist(step.additionSums ??= {}, additionSum) // ??= for buckets loaded from an older results file
        bumpHist(step.productLengths ??= {}, productLength)

        // ---- same totals, sliced by number length ----
        const lengthStats = (numberLengths[length] ??= {
            found: 0,
            steps: {},
            time: endTime - startTime,
        })
        const lengthStep = (lengthStats.steps[steps] ??= createLengthStepBucket(
            snapshot(additionSum, multiplySum, numberValue),
        ))

        lengthStep.additionSum += additionSum
        lengthStep.multiplySum += multiplySum
        lengthStep.last = snapshot(additionSum, multiplySum, numberValue)
        lengthStep.count++
        lengthStep.combinations += combinations
        bumpHist(lengthStep.additionSums ??= {}, additionSum)
        bumpHist(lengthStep.productLengths ??= {}, productLength)
        lengthStats.found++
    }
}

export default createFoundRecorder
