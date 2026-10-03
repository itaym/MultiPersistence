import { parentPort } from 'node:worker_threads'

/**
 * Sends `text` to the parent thread to be printed; no-op on the main thread.
 *
 * @param {string} text
 * @returns {undefined}
 */
const showLog = text => parentPort?.postMessage({ text, type: 'showLog' })

export default showLog
