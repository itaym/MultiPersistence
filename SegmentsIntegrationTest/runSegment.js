import baseAccommodate from '#BaseAccommodate/index.js'
import HugeIntEx from '#HugeIntEx/index.js'
import {
    multiPer,
    multiPerNBC,
} from '#MultiplicativePersistence/index.js'
import createFoundRecorder from '#PersistWorker/foundRecorder.js'
import prepareMessage from '#utils/prepareMessage.js'

/**
 * Search-style digit cell.
 *
 * @returns {DigitCell}
 */
const cellFactory = () => ({
    additionSum: 0n, changed: true, count: 1n, digit: 0n, multiplySum: 0n, next: null, prev: null,
})

/**
 * Runs a search of `iterations` numbers after `seed`, in-process, recording every find.
 *
 * @param {bigint} base
 * @param {bigint} iterations numbers to check
 * @param {bigint} seed number the search starts after
 * @param {number} [notFound=0] starting found-nothing count
 * @returns {ComputationState}
 */
const runSegment = (base, iterations, seed, notFound = 0) => {
    const numBase = Number(base)
    const startTime = Date.now()

    const computationState = {
        iterations: { actual: 0n, count: 0, found_nothing: 0, found_nothing_break_at: 1_000_000_000 },
        last_number: seed,
        meta: { base, createdAt: Date.now(), endAt: 0n, id: crypto.randomUUID(), previousEndAt: seed },
        number_lengths: {},
        steps: {},
    }

    const createPermutations = baseAccommodate(base)
    const recordFound = createFoundRecorder(computationState)

    const currentNo = new HugeIntEx(base, cellFactory, seed)
    const message = prepareMessage.bind(currentNo)
    let actualIterations = 0n
    let countIterations = 0n
    let reduceResults

    while (currentNo.length === 1n && countIterations < iterations) {
        currentNo.addOneToSorted()
        actualIterations += 1n
        countIterations++
        reduceResults = multiPer(numBase, currentNo)
        if (reduceResults.steps !== 2) {
            recordFound(
                currentNo,
                Date.now(),
                Number(currentNo.length),
                message(actualIterations, reduceResults, startTime),
                startTime,
            )
        } else notFound++
    }

    while (true) {
        currentNo.addOneToSorted()
        actualIterations += 1n + createPermutations(currentNo)
        countIterations++
        reduceResults = multiPerNBC(numBase, currentNo)
        if (reduceResults.steps !== 2) {
            recordFound(
                currentNo,
                Date.now(),
                Number(currentNo.length),
                message(actualIterations, reduceResults, startTime),
                startTime,
            )
        } else notFound++

        if (countIterations === iterations) break
    }

    computationState.iterations.actual = actualIterations
    computationState.iterations.count = countIterations
    computationState.iterations.found_nothing = notFound
    computationState.last_number = currentNo.value
    computationState.meta.endAt = currentNo.value

    return computationState
}

export default runSegment
