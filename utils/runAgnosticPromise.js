/**
 * Lets `promise` run un-awaited; its outcome is ignored.
 *
 * @param {Promise<*>} promise
 * @returns {void}
 */
const runAgnosticPromise = promise => {
    promise.catch(() => {})
}

export default runAgnosticPromise
