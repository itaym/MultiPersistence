import factorial from './factorial.js'
import memorize from './memorize.js'

const calcCellsArrFactorial = memorize((numbersArr = [1n]) => {
    let result = 1n
    const length = numbersArr.length
    for (let x = 0; x < length; x++) {
        result *= factorial(numbersArr[x])
    }
    return result
})

export default calcCellsArrFactorial