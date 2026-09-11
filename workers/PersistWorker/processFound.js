import HugeIntEx from '#HugeIntEx/index.js'
import { setComputationState } from '#Config/computationStateIO.js'

/**
 * The `found` message payload sent by `multiPerSearch`.
 *
 * @typedef {Object} FoundPayload
 * @property {BigInt} calcIterations       calculated iterations at this tick
 * @property {number} countIterations      real iterations at this tick
 * @property {BigInt} currentNo            current number value
 * @property {number} endTime              timestamp of this tick (ms)
 * @property {FoundMessage[]} messages     the still-unsent batch
 * @property {number} notFound             current consecutive-miss count
 * @property {number} notFoundLimit        max tolerated consecutive misses
 */

/**
 * Feeds every stacked batch through the context's found-recorder.
 *
 * @param {WorkerContext} context
 * @param {number} endTime
 * @returns {number} messages drained
 */
const drainStackedMessages = (context, endTime) => {
    const { base, recordFound, startTime, stackMessages } = context
    const scratch = new HugeIntEx(0n, base)
    let count = 0

    for (const batch of stackMessages) {
        for (const message of batch) {
            scratch.fromString(message.currentNoStr, base)
            recordFound(message, scratch, message.currentNoStr.length, startTime, endTime)
        }
        count += batch.length
    }

    context.stackMessages = []
    return count
}

/**
 * Handles a `found` message: drains the batches, refreshes `computationState`, writes the
 * log to `process.env.log`, and persists to disk.
 *
 * @param {WorkerContext} context
 * @param {FoundPayload} found
 * @returns {Promise<void>}
 */
export const processFound = async (context, found) => {
    const { base, computationState, goal, log, range_start, startSessionTime, startTime } = context
    const { calcIterations, countIterations, currentNo, endTime, messages, notFound, notFoundLimit } = found

    context.stackMessages.push(messages)
    const messagesCount = drainStackedMessages(context, endTime)

    /** @type {import('../../Config/computationStateIO.js').Iterations} */
    computationState.iterations = {
        calculated: calcIterations,
        count: countIterations,
        found_nothing: notFound,
        found_nothing_break_at: notFoundLimit,
    }
    computationState.last_number = currentNo
    computationState.up_time = endTime - startTime
    computationState.goal ??= goal
    computationState.range_start ??= range_start

    delete found.messages

    process.env.log = log({
        ...found,
        countSteps: computationState.steps,
        lengths: computationState.number_lengths,
        messagesCount,
        startSessionTime,
        startTime,
    })

    await setComputationState(computationState, base)
}
