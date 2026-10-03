import { saveComputationState } from '#Config/computationStateIO.js'
import HugeIntEx from '#HugeIntEx/index.js'

/**
 * Records every stacked `found` message and clears the stack.
 *
 * @param {WorkerContext} context
 * @param {number} endTime
 * @returns {number} messages recorded
 */
const drainStackedMessages = (context, endTime) => {
    const { base, recordFound, stackMessages, startTime } = context
    const scratch = new HugeIntEx(base, undefined, 0n)
    let count = 0

    for (const batch of stackMessages) {
        for (const message of batch) {
            scratch.fromString(base, message.currentNoStr)
            recordFound(scratch, endTime, message.currentNoStr.length, message, startTime)
        }
        count += batch.length
    }

    context.stackMessages = []
    return count
}

/**
 * Handles a `found` report: records its messages, updates the state, logs and saves it.
 *
 * @param {WorkerContext} context
 * @param {FoundPayload} found
 * @returns {Promise<void>}
 */
const processFound = async (context, found) => {
    const { base, computationState, log, pseudoGoal, range_start, startSessionTime, startTime } = context
    const { actualIterations, countIterations, currentNo, endTime, messages, notFound, notFoundLimit } = found

    context.stackMessages.push(messages)
    const messagesCount = drainStackedMessages(context, endTime)

    computationState.iterations = {
        actual: actualIterations,
        count: countIterations,
        found_nothing: notFound,
        found_nothing_break_at: notFoundLimit,
    }
    computationState.last_number = currentNo
    computationState.up_time = endTime - startTime
    computationState.pseudoGoal ??= pseudoGoal
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

    await saveComputationState(base, computationState)
}

export default processFound
