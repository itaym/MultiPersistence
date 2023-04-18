import sleep from './sleep.js'

/**
 *
 * @param worker { Worker }
 * @param type { string }
 * @param data { Object }
 * @returns {Promise<boolean>}
 */
const postMessage = async (worker, type, data) => {

    if (type === 'init')
        process.env.isWorkerReady = 'true'

    if (process.env.isWorkerReady === 'true') {
        process.env.isWorkerReady = 'false'
        worker.postMessage({
                type,
                data,
            }
        )
        await sleep(1)
        return true
    }
    return false
}

export default postMessage