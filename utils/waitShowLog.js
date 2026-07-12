import gaySchluffen from './gaySchluffen.js'

/**
 * Wait until a worker process signals readiness, printing progress dots while waiting.
 *
 * This asynchronous function repeatedly checks:
 *
 *     process.env.isWorkerReady === 'true'
 *
 * If the worker is not ready, it prints a dot to stdout and sleeps for the
 * specified number of milliseconds using `gaySchluffen()`. Once ready, it
 * prints the worker's log message stored in `process.env.log`.
 *
 * @async
 * @param {number} [milliSeconds=20]
 *     Delay between readiness checks, in milliseconds.
 *
 * @returns {Promise<void>}
 *     Resolves once the worker is ready and the log has been printed.
 */
const waitShowLog = async (milliSeconds = 20) => {
    while (process.env.isWorkerReady !== 'true') {
        process.stdout.write(".")
        await gaySchluffen(milliSeconds)
    }
    console.log(`\n${process.env.log}`)
}

export default waitShowLog