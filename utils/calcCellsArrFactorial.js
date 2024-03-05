import factorial from './factorial.js'
import memorize from './memorize.js'

const calcCellsArrFactorial =(numbersArr) => {
    if (!numbersArr.length) return 1n
    let result = factorial(numbersArr.pop())
    return result * calcCellsArrFactorial(numbersArr)
}

export default calcCellsArrFactorial