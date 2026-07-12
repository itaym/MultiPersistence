import HugeInt from '../HugeInt/index.js'
import ToPrimitive from '../ToPrimitive/index.js'
import baseAccommodate from './BaseAccommodate/index.js'
import onModuloBase from './onNotModuloBase.js'
import postMessages from '../utils/postMessage.js'
import prepareMessage from '../utils/prepareMessage.js'
import waitShowLog from '../utils/waitShowLog.js'
import { multiPer, multiPerNBC } from './index.js'

/**
 * Multiplicative Persistence Search Engine
 *
 * This module implements the main search loop used to explore numbers in a
 * given base and identify those with non-trivial multiplicative persistence.
 *
 * The search operates on HugeInt instances, incrementing them in sorted form,
 * applying pruning rules, computing persistence, batching results, sending
 * them to a worker thread for processing or logging, and dynamically adjusting
 * logging intervals based on runtime performance.
 *
 * The loop is optimized for long-running computations and supports:
 *  - Worker message batching
 *  - Dynamic logging intervals
 *  - Zero/modulo-based pruning
 *  - Session continuation using previous iteration statistics
 *  - Switching between multiPer and multiPerNBC for performance
 */

/**
 * Performs the multiplicative persistence search loop.
 *
 * This function is the main computational engine of the system. It iterates
 * through HugeInt values, applies pruning rules, computes multiplicative
 * persistence, batches results, sends messages to a worker thread, and triggers
 * periodic logging based on dynamic timing heuristics.
 *
 * The search loop respects a semaphore-like mechanism via
 * `process.env.isWorkerReady`, ensuring that messages are only sent when the
 * worker is ready to receive them.
 *
 * Search behavior:
 *  - Initializes the HugeInt from the last processed number.
 *  - Increments the number using `addOneToSorted()`.
 *  - Applies modulo-based pruning via `onModuloBase`.
 *  - Computes persistence using either `multiPer` or `multiPerNBC`.
 *  - Tracks consecutive non-found results to determine when to break.
 *  - Batches found results into groups of 100 for efficient worker messaging.
 *  - Dynamically adjusts logging intervals based on iteration timing.
 *  - Sends periodic log messages containing detailed runtime statistics.
 *  - Performs a final log and cleanup after the search terminates.
 *
 * Performance notes:
 *  - The loop is optimized for extremely long-running searches.
 *  - Logging intervals adapt automatically to maintain consistent output.
 *  - Persistence computation switches to `multiPerNBC` when beneficial.
 *  - Pruning rules significantly reduce unnecessary persistence evaluations.
 *
 * @async
 * @function multiPerSearch
 *
 * @param {Object} initVars
 *     Initialization parameters for continuing a previous search session.
 *
 * @param {number} initVars.base
 *     Numerical base used for HugeInt digit interpretation.
 *
 * @param {Object} initVars.iterations
 *     Iteration statistics from previous runs.
 *
 * @param {number} initVars.iterations.calculated
 *     Total number of persistence calculations performed so far.
 *
 * @param {number} initVars.iterations.count
 *     Total number of iterations performed so far.
 *
 * @param {number} initVars.iterations.found_nothing
 *     Count of consecutive iterations that did not produce a non-trivial result.
 *
 * @param {number} initVars.iterations.found_nothing_break_at
 *     Maximum allowed consecutive non-found iterations before breaking.
 *
 * @param {bigint} initVars.last_number
 *     The last HugeInt value processed in the previous session.
 *
 * @param {number} initVars.up_time
 *     Total runtime accumulated across previous sessions.
 *
 * @param {number} log_interval
 *     Desired interval (in milliseconds) between log outputs.
 *
 * @param {number} startSessionTime
 *     Timestamp marking the start of the current session.
 *
 * @param {number} startTime
 *     Adjusted timestamp including previous uptime.
 *
 * @param {Worker} worker
 *     Worker thread instance receiving search results and log messages.
 *
 * @returns {Promise<void>}
 *     Resolves when the search loop terminates and final logs are sent.
 */

export const multiPerSearch = async (
    {
        base,
        iterations,
        last_number,
        up_time,
    },
    log_interval,
    startSessionTime,
    startTime,
    worker,
) => {

    let calcIterations = iterations.calculated
    let countIterations = iterations.count
    let currentNo = new HugeInt(last_number, base)
    let endTime

    let iterationsPerLog = countIterations
    let logAfter = (countIterations + countIterations / up_time * log_interval) || 250_000

    let messages = []
    let notFound = iterations.found_nothing
    let notFoundLimit = iterations.found_nothing_break_at
    let notToBreak = notFoundLimit > notFound

    let startTimeLog = startSessionTime
    let steps = 2

    /**
     * Bound version of multiPerNBC using the current HugeInt and base.
     * Used when switching to the optimized persistence calculation path.
     *
     * @type {Function}
     */
    const multiPerNBB = multiPerNBC.bind(null, currentNo, Number(base))

    /**
     * Bound version of multiPer using the current HugeInt and base.
     * Used as the default persistence calculation path.
     *
     * @type {Function}
     */
    let multiPerFn = multiPer.bind(null, currentNo, Number(base))

    /**
     * Bound version of prepareMessage, allowing message creation using the
     * current HugeInt context.
     *
     * @type {Function}
     */
    const prepareBindMessage = prepareMessage.bind(currentNo)

    /**
     * Bound version of onModuloBase, applying modulo-based pruning rules
     * directly to the current HugeInt.
     *
     * @type {Function}
     */
    const on_ModuloBase = onModuloBase.bind(currentNo)

    /**
     * Optional permutation generator used when base accommodation rules apply.
     * If unsupported, defaults to 1n.
     *
     * @type {ToPrimitive|bigint}
     */
    const createPermutations = baseAccommodate
        .supported.includes(process.normalizedEnv.base)
        ? new ToPrimitive(currentNo, baseAccommodate)
        : 1n

    /**
     * Creates a formatted message object containing persistence results and
     * iteration statistics for worker transmission.
     *
     * @returns {Object}
     *     Structured message containing timing, iteration counts, and persistence.
     */
    const createMessage = () => prepareBindMessage(startTime, calcIterations, steps)

    currentNo.addOneToSorted()

    /**
     * Main search loop:
     *  - Increments the HugeInt.
     *  - Applies pruning rules.
     *  - Computes persistence.
     *  - Tracks non-found streaks.
     *  - Batches found results.
     *  - Performs periodic logging.
     *  - Terminates when non-found streak exceeds threshold.
     */
    while (notToBreak) {

        on_ModuloBase()

        calcIterations += createPermutations
        countIterations++

        steps = multiPerFn()

        // Found a number with persistence != 2
        if (steps !== 2) {
            notFoundLimit = Math.max(countIterations, notFoundLimit)
            notFound = 0

            messages.push(createMessage())

            // Batch messages in groups of 100
            if (messages.length >= 100) {
                if (postMessages(worker, 'stack', { messages })) {
                    messages = []
                }
            }
        }
        else {
            // Not found — increment counter
            notFound++
            notToBreak = (notFoundLimit > notFound) &&
                (currentNo.length < process.normalizedEnv.goal_power_of10)
        }

        // Time to log
        if (countIterations > logAfter) {
            endTime = Date.now()
            const currentNoValue = currentNo.value

            // Switch to optimized multiPerNBC if needed
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

    /**
     * Final logging and cleanup:
     *  - Performs one last persistence decrement.
     *  - Sends final statistics to the worker.
     *  - Ensures all pending logs are flushed.
     */

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
