import baseAccommodate from '#BaseAccommodate/index.js'
import HugeIntEx from '#HugeIntEx/index.js'
import postMessages from '#utils/postMessage.js'
import prepareMessage from '#utils/prepareMessage.js'
import showLog from '#utils/showLog.js'
import waitForWorker from '#utils/waitForWorker.js'
import {
    multiPer,
    multiPerNBC,
} from './multiplicativePersistence.js'

/**
 * Search-style digit cell.
 *
 * @returns {DigitCell}
 */
const cellFactory = () => ({
    additionSum: 0n,
    changed: true,
    count: 1n,
    digit: 0n,
    multiplySum: 0n,
    next: null,
    prev: null,
})

/**
 * Main search loop: steps through canonical numbers, reports finds and checkpoints to the persist worker,
 * stops on the found-nothing limit.
 *
 * @param {number} check_interval_count iterations between time checks
 * @param {number} checkpoint_interval milliseconds between checkpoints
 * @param {ComputationState} computationState state to resume from
 * @param {number} log_interval milliseconds between log prints
 * @param {number} startSessionTime
 * @param {number} startTime
 * @param {() => Promise<*>} tick yields to the event loop
 * @param {Worker} worker persist worker
 * @returns {Promise<void>}
 */
// eslint-disable-next-line import-x/prefer-default-export
export const multiPerSearch = async (
    check_interval_count,
    checkpoint_interval,
    computationState,
    log_interval,
    startSessionTime,
    startTime,
    tick,
    worker,
) => {
    const { iterations, last_number } = computationState
    const { base } = process.normalizedEnv
    const numBase = Number(base)

    let actualIterations = iterations.actual
    let countIterations = iterations.count
    let notFound = iterations.found_nothing
    let notFoundLimit = iterations.found_nothing_break_at

    const currentNo = new HugeIntEx(base, cellFactory, last_number)
    const message = prepareMessage.bind(currentNo)

    let reduceResults
    let messages = []

    let iterationsCheckCount = 0
    let logLastTime = 0
    let checkpointLastTime = 0

    const createPermutations = baseAccommodate(base)

    /**
     * Stacks the current find and sends the stack when big enough.
     *
     * @returns {boolean} `false` when the stack is full and the worker is busy
     */
    const recordFound = () => {
        notFound = 0
        if (countIterations > notFoundLimit) notFoundLimit = countIterations
        messages.push(message(actualIterations, reduceResults, startTime))
        if (messages.length >= 100) {
            if (messages.length >= 10_000 && process.env.isWorkerReady !== 'true') return false

            if (postMessages({ messages }, 'stack', worker)) messages = []
        }
        return true
    }

    // ---- periodic log tick + final save ----
    let iterationsAtLastLog = countIterations
    let startTimeLog = startSessionTime

    /**
     * Sends a `found` checkpoint with the progress and stacked finds.
     *
     * @param {number} now
     * @returns {Promise<void>}
     */
    const checkpoint = async now => {
        const endTime = now
        const iterationsPerLog = countIterations - iterationsAtLastLog

        if (postMessages({
            actualIterations,
            countIterations,
            currentNo: currentNo.value, // = last number checked
            endTime,
            iterationsPerLog,
            length: currentNo.length,
            messages,
            notFound,
            notFoundLimit,
            startTimeLog,
        }, 'found', worker)) {
            messages = []
        }

        iterationsAtLastLog = countIterations
        startTimeLog = Date.now()
        await tick()
    }

    // ---- prologue: single-digit numbers need the base-case-aware multiPer ----
    // (only runs on a fresh start, or a resume that died mid-prologue)
    while (currentNo.length === 1n) {
        currentNo.addOneToSorted()
        actualIterations += 1n
        countIterations++
        iterationsCheckCount++
        reduceResults = multiPer(numBase, currentNo)
        if (reduceResults.steps !== 2) recordFound()
        else notFound++
    }
    // currentNo is now the first multi-digit number, already checked

    // ---- main loop: every number is multi-digit, so skip the base-case check ----
    while (true) {
        currentNo.addOneToSorted()
        actualIterations += 1n + createPermutations(currentNo)
        countIterations++
        reduceResults = multiPerNBC(numBase, currentNo)
        if (reduceResults.steps !== 2) {
            if (!recordFound()) {
                await waitForWorker()
            }
        } else notFound++

        if (++iterationsCheckCount >= check_interval_count) {
            const now = Date.now()
            if (now - log_interval > logLastTime) {
                logLastTime = now
                showLog(`\n${process.env.log}`)
            }
            if (now - checkpoint_interval > checkpointLastTime) {
                checkpointLastTime = now
                await checkpoint(now)
            }
            iterationsCheckCount = 0
        }
        if (notFound >= notFoundLimit) break
    }

    await checkpoint(Date.now())
    await waitForWorker()
    showLog(`\n${process.env.log}`)
}
