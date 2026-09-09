/**
 * Sends a message to the worker when it is ready; type `"init"` is always sent.
 *
 * @param {Worker} worker
 * @param {string} type message type
 * @param {any} data message payload
 * @returns {boolean} whether the message was sent
 */
const postMessage = (worker, type, data) => {

    if (type === 'init')
        process.env.isWorkerReady = 'true'

    if (process.env.isWorkerReady === 'true') {
        process.env.isWorkerReady = 'false'

        worker.postMessage({
            data,
            type,
        })

        return true
    }

    return false
}

export default postMessage
