import factorial from './factorial.js'

/**
 * Product of the factorials of every value in `numbersArr` (`1n` when empty). Consumes the array.
 *
 * @param {BigInt[]} numbersArr
 * @returns {BigInt}
 */
const calcCellsArrFactorial = (numbersArr) => {
    if (!numbersArr.length) return 1n
    let result = factorial(numbersArr.pop())
    return result * calcCellsArrFactorial(numbersArr)
}

export default calcCellsArrFactorial
