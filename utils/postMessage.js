/**
 * Posts `{ data, type }` to `worker` when it is ready (always for `'init'`), then marks it busy.
 *
 * @param {*} data
 * @param {string} type
 * @param {Worker} worker
 * @returns {boolean} whether the message was posted
 */
const postMessage = (data, type, worker) => {
    if (type === 'init') {
        process.env.isWorkerReady = 'true'
    }

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
