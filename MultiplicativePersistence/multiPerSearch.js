import HugeIntEx from '../HugeIntEx/index.js'
import baseAccommodate from './BaseAccommodate/index.js'
import postMessages from '../utils/postMessage.js'
import prepareMessage from '../utils/prepareMessage.js'
import waitShowLog from '../utils/waitShowLog.js'
import { multiPer, multiPerNBC } from './index.js'

/**
 * @typedef {import('../Config/computationStateIO.js').ComputationState} ComputationState
 * @typedef {import('../HugeInt/HugeInt.js').DigitCell} DigitCell
 * @typedef {import('../jsdoc-types.d.ts.js').ReduceResults} ReduceResults
 * @typedef {import('worker_threads').Worker} Worker
 */

/**
 * Search-style digit cell — carries the `reduceHI` caches
 * (`changed` / `additionSum` / `multiplySum`).
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
 * Runs the multiplicative-persistence search for one session.
 *
 * `computationState.last_number` is the last number that was fully checked
 * (`0` on a fresh start). The session advances one step past it and checks
 * forward, until a number reaches `goal_power_of10` digits or the not-found
 * tolerance is exhausted. Every message sent to the worker carries
 * `currentNo.value` — always the last number checked — so a resume picks up on
 * exactly the next one.
 *
 * @param {ComputationState} computationState  state to continue from
 * @param {number} log_interval                ms between log outputs
 * @param {number} startSessionTime            wall-clock start of this session
 * @param {number} startTime                   virtual start (`now - total up_time`)
 * @param {Worker} worker                      receives results and log ticks
 * @returns {Promise<void>}
 */
export const multiPerSearch = async (
    computationState,
    log_interval,
    startSessionTime,
    startTime,
    worker,
) => {
    const { base, iterations, last_number, up_time } = computationState
    const numBase = Number(base)
    const goalLength = process.normalizedEnv.goal_power_of10

    let calcIterations = iterations.calculated
    let countIterations = iterations.count
    let notFound = iterations.found_nothing
    let notFoundLimit = iterations.found_nothing_break_at

    const currentNo = new HugeIntEx(last_number, base, cellFactory)
    const message = prepareMessage.bind(currentNo)

    /** @type {ReduceResults} */
    let reduceResults
    let messages = []

    /**
     * Prunes `currentNo` past digit ranges that can't reach persistence > 2 and
     * returns how many permutations that skipped (`0n` if nothing, or for a base
     * with no rules). The `1n +` at the call site counts `currentNo` itself.
     *
     * @type {(currentNo: HugeIntEx) => BigInt}
     */
    const createPermutations = baseAccommodate

    /** Records one found number and flushes the batch at 100. */
    const recordFound = () => {
        notFound = 0
        if (countIterations > notFoundLimit) notFoundLimit = countIterations
        messages.push(message(startTime, calcIterations, reduceResults))
        if (messages.length >= 100 && postMessages(worker, 'stack', { messages })) {
            messages = []
        }
    }

    // ---- periodic log tick + final save ----
    let iterationsAtLastLog = countIterations
    let startTimeLog = startSessionTime
    let logAfter = (countIterations + countIterations / up_time * log_interval) || 250_000

    /** Sends a `found` tick and re-estimates the next log point. */
    const checkpoint = async () => {
        const endTime = Date.now()
        const iterationsPerLog = countIterations - iterationsAtLastLog
        const perIteration = (endTime - startTimeLog) / iterationsPerLog

        logAfter = Math.floor(log_interval / perIteration) + countIterations
        if (!Number.isFinite(logAfter)) logAfter = countIterations + 100_000

        await waitShowLog()
        if (postMessages(worker, 'found', {
            calcIterations,
            countIterations,
            currentNo: currentNo.value, // = last number checked
            endTime,
            iterationsPerLog,
            length: currentNo.length,
            messages,
            notFound,
            notFoundLimit,
            startTimeLog,
        })) {
            messages = []
        }

        iterationsAtLastLog = countIterations
        startTimeLog = Date.now()
    }

    // ---- prologue: single-digit numbers need the base-case-aware multiPer ----
    // (only runs on a fresh start, or a resume that died mid-prologue)
    while (currentNo.length === 1n) {
        currentNo.addOneToSorted()
        calcIterations += 1n
        countIterations++
        reduceResults = multiPer(currentNo, numBase)
        if (reduceResults.steps !== 2) recordFound()
        else notFound++
    }
    // currentNo is now the first multi-digit number, already checked

    // ---- main loop: every number is multi-digit, so skip the base-case check ----
    while (true) {
        currentNo.addOneToSorted()
        calcIterations += 1n + createPermutations(currentNo)
        countIterations++

        reduceResults = multiPerNBC(currentNo, numBase)
        if (reduceResults.steps !== 2) recordFound()
        else notFound++

        if (countIterations > logAfter) await checkpoint()

        if (notFound >= notFoundLimit || currentNo.length >= goalLength) break
    }

    await checkpoint()
    await waitShowLog()
}
