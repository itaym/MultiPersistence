import memorize from './memorize.js'
import { initConfig } from '../Config/config.js'
initConfig()

/**
 * Computes the factorial of a BigInt recursively.
 *
 * Returns 1n for values ≤ 1n; otherwise multiplies n by factorial(n − 1).
 *
 * @param {BigInt} number
 *     Value to compute.
 *
 * @returns {BigInt}
 *     Factorial result.
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
