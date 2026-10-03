import processFound from './processFound.js'
import createWorkerContext from './workerContext.js'

/**
 * Builds the persist worker's message handler; marks the worker ready after each message.
 *
 * @returns {(message: WorkerMessage) => Promise<void>}
 */
const createMessageHandler = () => {
    let context

    return async ({ data, type }) => {
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

            default:
                break
        }

        process.env.isWorkerReady = 'true'
    }
}

export default createMessageHandler
