/**
 * Sends a message to a worker thread using a lightweight semaphore mechanism
 * implemented via `process.env.isWorkerReady`.
 *
 * The main thread and worker coordinate using a shared environment variable:
 *
 *   - `isWorkerReady === 'true'`  → worker is idle, safe to send a message
 *   - `isWorkerReady === 'false'` → worker is busy, message must NOT be sent
 *
 * The worker sets `isWorkerReady = 'true'` after finishing each message.
 * The main thread sets it to `'false'` immediately before sending a new one.
 *
 * Special case:
 *   - When sending the `"init"` message, the worker is considered ready
 *     regardless of previous state, so `isWorkerReady` is forced to `'true'`
 *     to allow initialization to proceed without blocking.
 *
 * @module postMessage
 *
 * @param {Worker} worker
 *     The worker thread instance to send the message to.
 *
 * @param {string} type
 *     Message type identifier. Common values:
 *       - `"init"`  → initialization message
 *       - `"stack"` → batch accumulation message
 *       - `"found"` → final batch processing message
 *
 * @param {Object} data
 *     Arbitrary payload associated with the message. The worker interprets
 *     this based on the `type` field.
 *
 * @returns {boolean}
 *     `true`  → message was sent successfully
 *     `false` → worker was busy; message was NOT sent
 *
 * @example
 * // Attempt to send a message:
 * const success = postMessage(worker, "found", { messages: [...] })
 * if (!success) {
 *     // Worker is busy — retry later
 * }
 */
const postMessage = (worker, type, data) => {

    // Initialization messages always override readiness
    if (type === 'init')
        process.env.isWorkerReady = 'true'

    // Only send if worker is idle
    if (process.env.isWorkerReady === 'true') {
        process.env.isWorkerReady = 'false'

        worker.postMessage({
            type,
            data,
        })

        return true
    }

    // Worker is busy — message not sent
    return false
}

export default postMessage
