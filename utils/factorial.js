import memorize from './memorize.js'

/**
 * Factorial of `number` (`1n` for values ≤ 1n).
 *
 * @param {BigInt} number
 * @returns {BigInt}
 */
const factorialFn = number => {
    if (!number || (number <= 1n)) return 1n
    return number * factorial(number - 1n)
}

/**
 * Memoized factorial function.
 *
 * @type {(number: BigInt) => BigInt}
 */
const factorial = memorize(factorialFn, 'factorial')

export default factorial
