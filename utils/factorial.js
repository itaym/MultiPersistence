import memorize from './memorize.js'

/**
 * `number!`, recursing through the memorized {@link factorial}.
 *
 * @param {bigint} number
 * @returns {bigint} `1n` for `number <= 1n`
 */
const factorialFn = number => {
    if (!number || (number <= 1n)) return 1n
    return number * factorial(number - 1n)
}

/** @type {(number: bigint) => bigint} disk-memorized factorial */
const factorial = memorize(factorialFn, 'factorial')

export default factorial
