import gaySchluffen from './gaySchluffen.js'

/**
 * Waits until the worker signals readiness via `process.env.isWorkerReady`.
 *
 * @param {number} [milliSeconds=20] delay between checks
 * @returns {Promise<void>}
 */
const waitForWorker = async (milliSeconds = 20) => {
    while (process.env.isWorkerReady !== 'true') {
        await gaySchluffen(milliSeconds)
    }
}

export default waitForWorker
