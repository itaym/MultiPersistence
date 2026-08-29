import gaySchluffen from './gaySchluffen.js'

/**
 * Waits until the worker signals readiness and prints progress dots while waiting.
 *
 * Checks `process.env.isWorkerReady` repeatedly, sleeping between checks.
 * When ready, prints the worker log.
 *
 * @param {number} [milliSeconds=20]
 *     Delay between checks in milliseconds.
 *
 * @returns {Promise<void>}
 */
const waitShowLog = async (milliSeconds = 20) => {
    while (process.env.isWorkerReady !== 'true') {
        process.stdout.write('.')
        await gaySchluffen(milliSeconds)
    }
    console.log(`\n${process.env.log}`)
}

export default waitShowLog