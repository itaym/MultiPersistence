import memorize from './memorize.js'
import { initConfig } from '../Config/config.js'
initConfig()

/**
 * Compute the factorial of a BigInt value recursively.
 *
 * This is the pure (non‑memoized) implementation used as the base function
 * for the memoized `factorial`. It returns:
 *
 *   factorial(n) = n × factorial(n − 1)
 *
 * with the base case:
 *
 *   factorial(0) = factorial(1) = 1n
 *
 * @param {bigint} number
 *     The BigInt value whose factorial should be computed.
 *
 * @returns {bigint}
 *     The factorial of the given number.
 */
const factorialFn = number => {
    if (!number || (number <= 1n)) return 1n
    return number * factorial(number - 1n)
}

/**
 * Memoized factorial function.
 *
 * Uses the `memorize` utility to cache results of factorial computations,
 * significantly improving performance when factorial is called repeatedly
 * with the same BigInt inputs.
 *
 * @type {(number: bigint) => bigint}
 */
const factorial = memorize(factorialFn, 'factorial')

export default factorial