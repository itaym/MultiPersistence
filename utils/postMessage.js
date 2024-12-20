/**
 *
 * @param worker { Worker }
 * @param type { string }
 * @param data { Object }
 * @returns { boolean }
 */
const postMessage = (worker, type, data) => {

    if (type === 'init')
        process.env.isWorkerReady = 'true'

    if (process.env.isWorkerReady === 'true') {
        process.env.isWorkerReady = 'false'
        worker.postMessage({
                type,
                data,
            }
        )
        return true
    }
    return false
}

export default postMessage
