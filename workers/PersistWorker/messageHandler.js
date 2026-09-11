import { createWorkerContext } from './workerContext.js'
import { processFound } from './processFound.js'

/**
 * A message from the main thread.
 *
 * @typedef {Object} WorkerMessage
 * @property {'init' | 'stack' | 'found'} type
 * @property {*} data  `WorkerConfig` for `init`, `{ messages }` for `stack`, `FoundPayload` for `found`
 */

/**
 * Creates the `parentPort` message listener. Each message flips `process.env.isWorkerReady`
 * back to `'true'` when done; `init` builds the {@link WorkerContext} the rest read from.
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
