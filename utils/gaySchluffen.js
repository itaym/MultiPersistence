/**
 *
 * @param milliseconds
 * @returns {Promise<number>}
 */
const gaySchluffen = function(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(function (time) {
            resolve(time)
        }, milliseconds, milliseconds)
    })
}
export default gaySchluffen