/**
 * Asynchronous sleep utility that resolves after a given number of milliseconds.
 *
 * This function wraps `setTimeout` in a Promise and resolves with the same
 * `milliseconds` value that was passed in. It is used to pause execution
 * without blocking the event loop.
 *
 * @async
 * @param {number} milliseconds
 *     Duration to sleep, in milliseconds.
 *
 * @returns {Promise<number>}
 *     A Promise that resolves with the sleep duration.
 *
 * @example
 * await gaySchluffen(100)  // pauses for 100ms
 */

const gaySchluffen = function(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(function (time) {
            resolve(time)
        }, milliseconds, milliseconds)
    })
}
export default gaySchluffen