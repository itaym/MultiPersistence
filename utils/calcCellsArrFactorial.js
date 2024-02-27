import factorial from './factorial.js'

const calcCellsArrFactorial = (numbersArr) => {
    let result = 1n
    const length = numbersArr.length
    for (let x = 0; x < length; x++) {
        result *= factorial(numbersArr[x])
    }
    return result
}

export default calcCellsArrFactorial