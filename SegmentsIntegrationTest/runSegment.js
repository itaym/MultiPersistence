import baseAccommodate from '#MultiplicativePersistence/BaseAccommodate/index.js'
import HugeIntEx from '#HugeIntEx/index.js'
import { multiPer, multiPerNBC } from '#MultiplicativePersistence/index.js'
import prepareMessage from '#utils/prepareMessage.js'
import { createFoundRecorder } from '#workers/PersistWorker/foundRecorder.js'

const cellFactory = () => ({
    additionSum: 0n, changed: true, count: 1n, digit: 0n, multiplySum: 0n, next: null, prev: null,
})

/**
 * Runs the real multiplicative-persistence search from `seed` until at least `targetIterations`
 * calcIterations have accumulated — the same two-phase loop `multiPerSearch` runs (`multiPer`
 * for single-digit numbers, then `multiPerNBC` + `baseAccommodate`), without workers or messaging.
 *
 * @param {BigInt} seed last number already checked (`0n` for a fresh start)
 * @param {BigInt} base
 * @param {BigInt} iterations number of iterations to run
 * @param {number} [notFound=0] consecutive misses inherited from the previous segment
 * @returns {ComputationState}
 */
const runSegment = (seed, base, iterations, notFound = 0) => {
    const numBase = Number(base)
    const startTime = Date.now()

    const computationState = /** @type {ComputationState} */ {
        iterations: { calculated: 0n, count: 0, found_nothing: 0, found_nothing_break_at: 1_000_000_000 },
        last_number: seed,
        meta: { base, createdAt: Date.now(), endAt: 0n, id: crypto.randomUUID(), previousEndAt: seed },
        number_lengths: {},
        steps: {},
    }

    const createPermutations = baseAccommodate(base)
    const recordFound = createFoundRecorder(computationState)

    const currentNo = new HugeIntEx(seed, base, cellFactory)
    const message = prepareMessage.bind(currentNo)
    let calcIterations = 0n
    let countIterations = 0n
    let reduceResults

    while (currentNo.length === 1n && countIterations < iterations) {
        currentNo.addOneToSorted()
        calcIterations += 1n
        countIterations++
        reduceResults = multiPer(currentNo, numBase)
        if (reduceResults.steps !== 2) {
            recordFound(message(startTime, calcIterations, reduceResults), currentNo, Number(currentNo.length), startTime, Date.now())
        } else notFound++
    }

    while (true) {
        currentNo.addOneToSorted()
        calcIterations += 1n + createPermutations(currentNo)
        countIterations++
        reduceResults = multiPerNBC(currentNo, numBase)
        if (reduceResults.steps !== 2) {
            recordFound(message(startTime, calcIterations, reduceResults), currentNo, Number(currentNo.length), startTime, Date.now())
        } else notFound++

        if (countIterations === iterations) break
    }

    computationState.iterations.calculated = calcIterations
    computationState.iterations.count = countIterations
    computationState.iterations.found_nothing = notFound
    computationState.last_number = currentNo.value
    computationState.meta.endAt = currentNo.value

    return computationState
}

export default runSegment
