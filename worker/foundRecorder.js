import calcCellsArrFactorial from '../utils/calcCellsArrFactorial.js'
import factorial from '../utils/factorial.js'

/**
 * @typedef {import('../utils/prepareMessage.js').FoundMessage} FoundMessage
 * @typedef {import('../Config/computationStateIO.js').ComputationState} ComputationState
 */

/**
 * Immutable snapshot of a single found number, stored as `first` / `last` on the
 * per-step and per-length buckets.
 *
 * @typedef {Object} FoundSnapshot
 * @property {BigInt} additionSum    digit-addition sum of the number
 * @property {BigInt} numberValue the number itself
 * @property {BigInt} multiplySum    digit-multiplication sum of the number
 */

/**
 * Callback run for every found number as its batch is drained.
 *
 * @callback FoundRecorder
 * @param {FoundMessage} found        the message describing the number
 * @param {HugeInt} currentNo         the number, parsed into a scratch HugeInt
 * @param {number} length             digit length of the number
 * @param {number} startTime          run start timestamp (ms)
 * @param {number} endTime            timestamp of the current log tick (ms)
 * @returns {void}
 */

/**
 * @param {BigInt} additionSum
 * @param {BigInt} multiplySum
 * @param {BigInt} numberValue
 * @returns {FoundSnapshot}
 */
const snapshot = (additionSum, multiplySum, numberValue) => ({ additionSum, numberValue, multiplySum })

/**
 * Bumps a `{ key: count }` histogram.
 *
 * @param {Object<string, number>} hist
 * @param {number|string} key
 * @returns {void}
 */
const bumpHist = (hist, key) => {
    hist[key] = (hist[key] || 0) + 1
}

/**
 * Fresh accumulator for a persistence step, seeded with its first number.
 *
 * @param {number} step
 * @param {number} atRunTime
 * @param {FoundSnapshot} first
 * @returns {import('../Config/computationStateIO.js').TypeStep}
 */
const createStepBucket = (step, atRunTime, first) => ({
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
 * Fresh accumulator for one persistence step within a given number length.
 *
 * @param {FoundSnapshot} first
 * @returns {Object}
 */
const createLengthStepBucket = (first) => ({
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
 * Digit-cell repeat-counts of `currentNo` (the identical-digit permutation divisor), or `[1n]`
 * when every cell count is 1.
 *
 * @param {HugeInt} currentNo
 * @returns {BigInt[]}
 */
const createLengthsArray = (currentNo) => {
    const array = []

    for (let cell = currentNo.firstCell; cell; cell = cell.next) {
        if (cell.count !== 1n) array.push(cell.count)
    }

    if (array.length === 0) array.push(1n)
    return array
}

/**
 * Builds the {@link FoundRecorder} for `computationState`. It folds each found number into
 * `steps` (per persistence depth) and `number_lengths` (the same, sliced by digit length).
 *
 * @param {ComputationState} computationState
 * @returns {FoundRecorder}
 */
export const createFoundRecorder = (computationState) => {
    const { steps: countSteps, number_lengths: numberLengths } = computationState

    return ({ additionSum, atRunTime, calcIterations, multiplySum, productLength, steps }, currentNo, length, startTime, endTime) => {
        const numberValue = currentNo.value
        const combinations = factorial(BigInt(length)) / calcCellsArrFactorial(createLengthsArray(currentNo))

        // ---- totals for this persistence step ----
        const step = (countSteps[steps] ??= createStepBucket(steps, atRunTime, snapshot(additionSum, multiplySum, numberValue)))

        step.additionSum += additionSum
        step.multiplySum += multiplySum
        step.combinations += combinations
        step.count++
        step.last = snapshot(additionSum, multiplySum, numberValue)
        step.atRunTime = atRunTime
        step.iteration = calcIterations
        bumpHist(step.additionSums ??= {}, additionSum) // ??= for buckets loaded from an older results file
        bumpHist(step.productLengths ??= {}, productLength)

        // ---- same totals, sliced by number length ----
        const lengthStats = (numberLengths[length] ??= {
            found: 0,
            steps: {},
            time: endTime - startTime,
        })
        const lengthStep = (lengthStats.steps[steps] ??= createLengthStepBucket(snapshot(additionSum, multiplySum, numberValue)))

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
