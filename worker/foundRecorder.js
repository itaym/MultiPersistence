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
 * @property {BigInt} multiplySum    digit-multiplication sum of the number
 * @property {BigInt} currentNoValue the number itself
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
 * @param {BigInt} currentNoValue
 * @returns {FoundSnapshot}
 */
const snapshot = (additionSum, multiplySum, currentNoValue) => ({ additionSum, multiplySum, currentNoValue })

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
    multiplySum: 0n,
    atRunTime,
    combinations: 0n,
    count: 0,
    first,
    iteration: 0,
    last: first,
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
    multiplySum: 0n,
    count: 0,
    combinations: 0n,
    first,
    last: first,
})

/**
 * Digit-group repeat-counts of `currentNo`, used to divide out identical-digit
 * permutations when counting combinations. Falls back to `[1n]` when every digit
 * cell has a count of 1.
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
 * Builds the {@link FoundRecorder} bound to a computation state. The returned
 * function folds each found number into two views of `computationState`:
 * `steps` (totals per persistence depth) and `number_lengths` (the same, sliced
 * by digit length).
 *
 * @param {ComputationState} computationState
 * @returns {FoundRecorder}
 */
export const createFoundRecorder = (computationState) => {
    const { steps: countSteps, number_lengths: numberLengths } = computationState

    return ({ atRunTime, calcIterations, steps, additionSum, multiplySum }, currentNo, length, startTime, endTime) => {
        const currentNoValue = currentNo.value
        const combinations = factorial(BigInt(length)) / calcCellsArrFactorial(createLengthsArray(currentNo))

        // ---- totals for this persistence step ----
        const step = (countSteps[steps] ??= createStepBucket(steps, atRunTime, snapshot(additionSum, multiplySum, currentNoValue)))

        step.additionSum += additionSum
        step.multiplySum += multiplySum
        step.combinations += combinations
        step.count++
        step.last = snapshot(additionSum, multiplySum, currentNoValue)
        step.atRunTime = atRunTime
        step.iteration = calcIterations

        // ---- same totals, sliced by number length ----
        const lengthStats = (numberLengths[length] ??= {
            found: 0,
            time: endTime - startTime,
            steps: {},
        })
        const lengthStep = (lengthStats.steps[steps] ??= createLengthStepBucket(snapshot(additionSum, multiplySum, currentNoValue)))

        lengthStep.additionSum += additionSum
        lengthStep.multiplySum += multiplySum
        lengthStep.last = snapshot(additionSum, multiplySum, currentNoValue)
        lengthStep.count++
        lengthStep.combinations += combinations
        lengthStats.found++
    }
}
