import factorial from './factorial.js'

/**
 * Recursively compute the product of factorials for all BigInt values in an array.
 *
 * The function mutates the input array by popping elements from the end.
 * For an array `[a, b, c]`, the result is:
 *
 *     factorial(c) * factorial(b) * factorial(a)
 *
 * If the array is empty, the function returns `1n`.
 *
 * @param {BigInt[]} numbersArr
 *     Array of BigInt values whose factorials will be multiplied.
 *
 * @returns {BigInt}
 *     The product of all factorials in the array.
 *
 * @example
 * calcCellsArrFactorial([2n, 3n])  // → factorial(3) * factorial(2) = 6n * 2n = 12n
 */
const calcCellsArrFactorial = (numbersArr) => {
    if (!numbersArr.length) return 1n
    let result = factorial(numbersArr.pop())
    return result * calcCellsArrFactorial(numbersArr)
}

export default calcCellsArrFactorial