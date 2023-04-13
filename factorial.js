import memorize from './memorize.js'

/**
 *
 * @param  number {bigint}
 * @return {bigint}
 */
const factorialFn = number => {
    if (number <= 1n) return number
    return number * factorial(number - 1n)
}
/**
 *
 * @type {function(...[bigint]):bigint}
 */
const factorial = memorize(factorialFn)

export default factorial