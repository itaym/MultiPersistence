import { parentPort } from 'worker_threads'

/**
 * Posts log text to the main thread instead of printing it — a worker's stdout is
 * piped through the parent and a slow terminal can stall the search loop.
 *
 * @param {string} text
 * @returns {void|undefined}
 */
const showLog = (text) => parentPort?.postMessage({ type: 'showLog', text })

export default showLog
