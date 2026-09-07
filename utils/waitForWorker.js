import gaySchluffen from './gaySchluffen.js'

/**
 * Waits until the worker signals readiness
 * Polls `process.env.isWorkerReady`, sleeping `milliSeconds` between checks.
 *
 * @param {number} [milliSeconds=20]
 *     Delay between checks in milliseconds.
 *
 * @returns {Promise<void>}
 */
const waitForWorker = async (milliSeconds = 20) => {
    while (process.env.isWorkerReady !== 'true') {
        await gaySchluffen(milliSeconds)
    }
    console.log(`\n${process.env.log}`)
}

export default waitForWorker
