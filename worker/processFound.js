import HugeInt from '../HugeInt/index.js'
import { setComputationState } from '../Config/computationStateIO.js'

/**
 * @typedef {import('./workerContext.js').WorkerContext} WorkerContext
 * @typedef {import('../utils/prepareMessage.js').FoundMessage} FoundMessage
 */

/**
 * The `found` message payload sent by `multiPerSearch`.
 *
 * @typedef {Object} FoundPayload
 * @property {BigInt} calcIterations       calculated iterations at this tick
 * @property {number} countIterations      real iterations at this tick
 * @property {BigInt} currentNo            current number value
 * @property {number} endTime              timestamp of this tick (ms)
 * @property {number} notFoundLimit        max tolerated consecutive misses
 * @property {FoundMessage[]} messages     the still-unsent batch
 * @property {number} notFound             current consecutive-miss count
 */

/**
 * Replays every stacked batch (plus the one carried on this message) through the
 * context's found-recorder, using a single scratch HugeInt.
 *
 * @param {WorkerContext} context
 * @param {number} endTime
 * @returns {number} total number of messages drained
 */
const drainStackedMessages = (context, endTime) => {
    const { base, recordFound, startTime, stackMessages } = context
    const scratch = new HugeInt(0n, base)
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
 * Handles a `found` message: drains all pending batches into `computationState`,
 * refreshes the iteration/last-number/up-time fields, renders the log snapshot
 * into `process.env.log`, and persists the state to disk.
 *
 * @param {WorkerContext} context
 * @param {FoundPayload} found
 * @returns {Promise<void>}
 */
export const processFound = async (context, found) => {
    const { base, computationState, log, startSessionTime, startTime } = context
    const { calcIterations, countIterations, currentNo, endTime, notFoundLimit, messages, notFound } = found

    context.stackMessages.push(messages)
    const messagesCount = drainStackedMessages(context, endTime)

    /** @type {import('../Config/computationStateIO.js').Iterations} */
    computationState.iterations = {
        calculated: calcIterations,
        count: countIterations,
        found_nothing: notFound,
        found_nothing_break_at: notFoundLimit,
    }
    computationState.last_number = currentNo
    computationState.up_time = endTime - startTime

    delete found.messages

    process.env.log = log({
        ...found,
        countSteps: computationState.steps,
        messagesCount,
        lengths: computationState.number_lengths,
        startSessionTime,
        startTime,
    })

    await setComputationState(computationState, base)
}
