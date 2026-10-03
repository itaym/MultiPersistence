/**
 * Resolves after `milliseconds`.
 *
 * @param {number} milliseconds
 * @returns {Promise<number>} `milliseconds`
 */
const gaySchluffen = milliseconds => new Promise(resolve => {
    setTimeout(time => {
        resolve(time)
    }, milliseconds, milliseconds)
})

export default gaySchluffen
