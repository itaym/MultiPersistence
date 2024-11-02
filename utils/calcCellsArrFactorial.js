import factorial from './factorial.js'

/**
 *
 * @param {bigint[]} numbersArr
 * @returns {bigint}
 */
const calcCellsArrFactorial = (numbersArr) => {
    if (!numbersArr.length) return 1n
    let result = factorial(numbersArr.pop())
    return result * calcCellsArrFactorial(numbersArr)
}

export default calcCellsArrFactorial