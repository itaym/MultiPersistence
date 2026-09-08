import HugeIntEx from '../HugeIntEx/index.js'
import baseAccommodate from './BaseAccommodate/index.js'
import postMessages from '../utils/postMessage.js'
import prepareMessage from '../utils/prepareMessage.js'
import waitForWorker from '../utils/waitForWorker.js'
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
 * @param {number} check_interval_count        iterations between wall-clock checks
 * @param {number} checkpoint_interval         ms between checkpoint saves
 * @param {ComputationState} computationState  state to continue from
 * @param {number} log_interval                ms between log prints
 * @param {number} startSessionTime            wall-clock start of this session
 * @param {number} startTime                   virtual start (`now - total up_time`)
 * @param {Worker} worker                      receives results and log ticks
 * @returns {Promise<void>}
 */
export const multiPerSearch = async (
    check_interval_count,
    checkpoint_interval,
    computationState,
    log_interval,
    startSessionTime,
    startTime,
    worker,
) => {
    const { base, iterations, last_number } = computationState
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

    let iterationsCheckCount = 0
    let logLastTime = 0
    let checkpointLastTime = 0

    /**
     * Prunes `currentNo` past digit ranges that can't reach persistence > 2 and
     * returns how many permutations that skipped (`0n` if nothing, or for a base
     * with no rules). The `1n +` at the call site counts `currentNo` itself.
     *
     * @type {(currentNo: HugeIntEx) => BigInt}
     */
    const createPermutations = baseAccommodate

    /**
     * Records one found number: clears the not-found streak, ratchets
     * `notFoundLimit` up to the current iteration count, and appends the number
     * to the pending `messages` batch. At 100 the batch is handed to the worker
     * as a `'stack'` message (and cleared) when the worker is ready.
     *
     * @returns {boolean} `false` when the batch has grown past 10,000 and the
     *   worker still isn't ready — the caller should `await waitForWorker()` to
     *   let it drain; `true` otherwise.
     */
    const recordFound = () => {
        notFound = 0
        if (countIterations > notFoundLimit) notFoundLimit = countIterations
        messages.push(message(startTime, calcIterations, reduceResults))
        if (messages.length >= 100) {
            if (messages.length >= 10_000 && process.env.isWorkerReady !== 'true') return false

            if (postMessages(worker, 'stack', { messages })) messages = []
        }
        return true
    }

    // ---- periodic log tick + final save ----
    let iterationsAtLastLog = countIterations
    let startTimeLog = startSessionTime

    /** Sends a `found` tick and re-estimates the next log point. */
    const checkpoint = async (now) => {
        const endTime = now
        const iterationsPerLog = countIterations - iterationsAtLastLog

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
        iterationsCheckCount++
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
        if (reduceResults.steps !== 2) {
            if (!recordFound()) {
                await waitForWorker()
            }
        }
        else notFound++

        if (++iterationsCheckCount >= check_interval_count) {
            const now = Date.now()
            if (now - log_interval > logLastTime) {
                logLastTime = now
                console.log(`\n${process.env.log}`)
            }
            if (now - checkpoint_interval > checkpointLastTime) {
                checkpointLastTime = now
                await checkpoint(now)
            }
            iterationsCheckCount = 0
        }
        if (notFound >= notFoundLimit || currentNo.length >= goalLength) break
    }

    await checkpoint(Date.now())
    await waitForWorker()
    console.log(`\n${process.env.log}`)
}
