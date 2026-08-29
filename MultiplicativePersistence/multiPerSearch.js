import HugeInt from '../HugeInt/index.js'
import ToPrimitive from '../ToPrimitive/index.js'
import baseAccommodate from './BaseAccommodate/index.js'
import onModuloBase from './onNotModuloBase.js'
import postMessages from '../utils/postMessage.js'
import prepareMessage from '../utils/prepareMessage.js'
import waitShowLog from '../utils/waitShowLog.js'
import { multiPer, multiPerNBC } from './index.js'

/**
 * Executes the multiplicative‑persistence search loop.
 *
 * Iterates HugeInt values, applies pruning rules, computes persistence,
 * batches results, sends messages to a worker, and performs periodic logging.
 *
 * @async
 * @function multiPerSearch
 *
 * @param {ComputationState} computationState
 *     Initial state for continuing a search session.
 *
 * @param {number} log_interval
 *     Interval in milliseconds between log outputs.
 *
 * @param {number} startSessionTime
 *     Timestamp marking the start of the session.
 *
 * @param {number} startTime
 *     Adjusted timestamp including previous uptime.
 *
 * @param {Worker} worker
 *     Worker receiving search results and logs.
 *
 * @returns {Promise<void>}
 *     Resolves when the search loop finishes.
 */
export const multiPerSearch = async (
    computationState,
    log_interval,
    startSessionTime,
    startTime,
    worker,
) => {

    const {
        base,
        iterations,
        last_number,
        up_time,
    } = computationState

    let calcIterations = iterations.calculated
    let countIterations = iterations.count

    let currentNo = new HugeInt(last_number, base, () => ({
        additionSum: 0n,
        changed: true,
        count: 1n,
        digit: 0n,
        next: null,
        prev: null,
        multiplySum: 0n}))
    let endTime
    let iterationsPerLog = countIterations
    let logAfter = (countIterations + countIterations / up_time * log_interval) || 250_000

    let messages = []
    let notFound = iterations.found_nothing
    let notFoundLimit = iterations.found_nothing_break_at
    let notToBreak = notFoundLimit > notFound

    let startTimeLog = startSessionTime
    /** @type {ReduceResults} */
    let reduceResults

    /**
     * Bound persistence functions for the current HugeInt and base.
     *
     * @type {Function}
     */
    const multiPerNBB = multiPerNBC.bind(null, currentNo, Number(base))
    let multiPerFn = multiPer.bind(null, currentNo, Number(base))

    /**
     * Bound message creator for the current HugeInt.
     *
     * @type {Function}
     */
    const prepareBindMessage = prepareMessage.bind(currentNo)

    /**
     * Bound modulo‑based pruning function.
     *
     * @type {Function}
     */
    const on_ModuloBase = onModuloBase.bind(currentNo)

    /**
     * Optional permutation generator for base‑accommodation rules.
     *
     * @type {ToPrimitive|BigInt}
     */
    const createPermutations = baseAccommodate
        .supported.includes(process.normalizedEnv.base)
        ? new ToPrimitive(currentNo, baseAccommodate)
        : 1n

    /**
     * Creates a formatted message containing persistence results.
     *
     * @returns {FoundMessage}
     */
    const createMessage = () =>
        prepareBindMessage(startTime, calcIterations, reduceResults)

    currentNo.addOneToSorted()

    while (notToBreak) {

        on_ModuloBase()

        calcIterations += createPermutations
        countIterations++

        reduceResults = multiPerFn()

        if (reduceResults.steps !== 2) {

            notFoundLimit = Math.max(countIterations, notFoundLimit)
            notFound = 0

            messages.push(createMessage())

            if (messages.length >= 100) {
                if (postMessages(worker, 'stack', { messages })) {
                    messages = []
                }
            }
        }
        else {
            notFound++
            notToBreak = (notFoundLimit > notFound) &&
                (currentNo.length < process.normalizedEnv.goal_power_of10)
        }

        if (countIterations > logAfter) {
            endTime = Date.now()
            const currentNoValue = currentNo.value

            if (multiPerFn !== multiPerNBB) {
                multiPerFn = multiPerNBB
            }

            iterationsPerLog = countIterations - iterationsPerLog
            const timeIteration = (endTime - startTimeLog) / iterationsPerLog

            logAfter = Math.floor(log_interval / timeIteration) + countIterations
            if (logAfter === Infinity) logAfter = countIterations + 100_000

            await waitShowLog()

            if (postMessages(worker, 'found', {
                calcIterations,
                countIterations,
                currentNo: currentNoValue,
                endTime,
                notFoundLimit,
                iterationsPerLog,
                messages,
                notFound,
                startTimeLog,
            })) {
                messages = []
            }

            iterationsPerLog = countIterations
            startTimeLog = Date.now()
        }

        currentNo.addOneToSorted()
    }

    endTime = Date.now()
    await waitShowLog()

    currentNo.subtractOne()

    postMessages(worker, 'found', {
        calcIterations,
        countIterations,
        currentNo: currentNo.value,
        endTime,
        notFoundLimit,
        iterationsPerLog,
        length: currentNo.length,
        messages,
        notFound,
        startTimeLog,
    })

    await waitShowLog()
}
