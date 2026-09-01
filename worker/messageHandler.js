import { createWorkerContext } from './workerContext.js'
import { processFound } from './processFound.js'

/**
 * @typedef {import('./workerContext.js').WorkerContext} WorkerContext
 * @typedef {import('./processFound.js').FoundPayload} FoundPayload
 * @typedef {import('../utils/prepareMessage.js').FoundMessage} FoundMessage
 */

/**
 * A message from the main thread.
 *
 * @typedef {Object} WorkerMessage
 * @property {'init' | 'stack' | 'found'} type
 * @property {*} data  `WorkerConfig` for `init`, `{ messages }` for `stack`, `FoundPayload` for `found`
 */

/**
 * Creates the `parentPort` message listener.
 *
 * The worker never blocks: it processes one message, then flips the
 * `process.env.isWorkerReady` semaphore so the main thread may send the next.
 * `init` builds the {@link WorkerContext} that every later message reads from.
 *
 * @returns {(message: WorkerMessage) => Promise<void>}
 */
export const createMessageHandler = () => {
    /** @type {WorkerContext} */
    let context

    return async ({ type, data }) => {
        switch (type) {

            case 'init':
                context = createWorkerContext(data)
                break

            case 'stack':
                context.stackMessages.push(data.messages)
                break

            case 'found':
                await processFound(context, data)
                break
        }

        process.env.isWorkerReady = 'true'
    }
}
