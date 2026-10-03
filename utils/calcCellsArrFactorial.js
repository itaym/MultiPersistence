import factorial from './factorial.js'

/**
 * Product of the factorials of `numbersArr`; empties the array.
 *
 * @param {bigint[]} numbersArr
 * @returns {bigint}
 */
const calcCellsArrFactorial = numbersArr => {
    if (!numbersArr.length) return 1n
    const result = factorial(numbersArr.pop())
    return result * calcCellsArrFactorial(numbersArr)
}

export default calcCellsArrFactorial
