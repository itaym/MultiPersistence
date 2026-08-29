/**
 * Sends a message to a worker if it is marked as ready.
 *
 * For type `"init"` readiness is forced. Otherwise the message is sent only
 * when `process.env.isWorkerReady === 'true'`.
 *
 * @param {Worker} worker
 *     Worker instance.
 *
 * @param {string} type
 *     Message type.
 *
 * @param {any} data
 *     Message payload.
 *
 * @returns {boolean}
 *     Whether the message was sent.
 */
const postMessage = (worker, type, data) => {

    if (type === 'init')
        process.env.isWorkerReady = 'true'

    if (process.env.isWorkerReady === 'true') {
        process.env.isWorkerReady = 'false'

        worker.postMessage({
            type,
            data,
        })

        return true
    }

    return false
}

export default postMessage
