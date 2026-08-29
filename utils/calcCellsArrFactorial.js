import factorial from './factorial.js'

/**
 * Computes the product of factorials for all BigInt values in an array.
 *
 * Mutates the array by popping elements and multiplying their factorials.
 * Returns 1n for an empty array.
 *
 * @param {BigInt[]} numbersArr
 *     Array of BigInt values.
 *
 * @returns {BigInt}
 *     Product of factorials.
 */
const calcCellsArrFactorial = (numbersArr) => {
    if (!numbersArr.length) return 1n
    let result = factorial(numbersArr.pop())
    return result * calcCellsArrFactorial(numbersArr)
}

export default calcCellsArrFactorial
