import gaySchluffen from './gaySchluffen.js'

/**
 * Resolves once `process.env.isWorkerReady` is `'true'`.
 *
 * @param {number} [milliSeconds=20] polling interval
 * @returns {Promise<void>}
 */
const waitForWorker = async (milliSeconds = 20) => {
    while (process.env.isWorkerReady !== 'true') {
        await gaySchluffen(milliSeconds)
    }
}

export default waitForWorker
