import memorize from './memorize.js'

/**
 *
 * @param {bigint} number
 * @returns {bigint}
 */
const factorialFn = number => {
    if (!number || (number <= 1n)) return 1n
    return number * factorial(number - 1n)
}

/**
 *
 * @type {(number: bigint) => bigint}
 */
const factorial = memorize(factorialFn, 'factorial')

export default factorial