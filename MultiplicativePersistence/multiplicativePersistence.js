import { memorizeForPowerBy } from '../memorize.js'
import { digitsValue } from '../Digits/index.js'

/**
 *
 * @type {function(...[*]): (bigint|*)}
 */
const powerBigInt = memorizeForPowerBy((value, powerBy) => {
    return value ** powerBy
})
/**
 *
 * @param hugeInt {HugeInt}
 * @return {DigitCell[]}
 */
const hugeIntCreatePowerArray = hugeInt => {
    return hugeInt.cellsArr.map(
        ({digit, count}) => powerBigInt(digit, count)
    )
}

/**
 *
 * @param str {string} Representing a bigint number
 * @return {DigitCell[]}
 */
function getDigitsLengths(str) {
    const lengths = []
    let endIndex = 0
    let startIndex = 0

    while (startIndex < str.length) {
        const digit = str[endIndex]
        endIndex = str.lastIndexOf(digit) + 1
        lengths.push({digit:digitsValue[digit], count: BigInt(endIndex - startIndex)})
        startIndex = endIndex
    }
    return lengths;
}

/**
 *
 * @param bigIntStr {string}
 * @return {DigitCell[]}
 */
const bigIntCreatePowerArray = bigIntStr => {
    // const digitsArr = bigIntStr.match(/((.)\2*)/g)
    const lengths = getDigitsLengths(bigIntStr)
    return lengths.map(
        ({digit, count}) => powerBigInt(digit, count)
    )
}
/**
 *
 * @param currentNo {HugeInt}
 * @return {DigitCell[]}
 */
const toPowerArray1st = (currentNo) => {
    return hugeIntCreatePowerArray(currentNo)
}
/**
 *
 * @type {number[]}
 */
const arrayWithZero = [0]
/**
 *
 * @param currentNo {HugeInt}
 * @param base
 * @return {[number]|(bigint|*)[]}
 */
const toPowerArray2nd = (currentNo, base) => {
    const currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    return bigIntCreatePowerArray(currentNoStr.split('').sort().join(''))
}
/**
 *
 * @param a {bigint}
 * @param b
 * @return {bigint}
 */
const reduce = (a, b) => {
    return a * b
}
/**
 *
 * @param toPowerArray {function}
 * @return {function(HugeInt, number): (number)}
 */
const multiplicativePersistence1 = function (toPowerArray) {
    return function (currentNo, base) {
        if (currentNo.isLTBase()) return 0
        const digits = toPowerArray(currentNo, base)
        const multiplyResult = digits.reduce(reduce)

        return 1 + multiPer2(multiplyResult, base)
    }
}
/**
 *
 * @param toPowerArray {function}
 * @return {function(bigint, number): (number)}
 */
const multiplicativePersistence2 = function (toPowerArray) {
    return function (currentNo, base) {
        if (currentNo < base) return 0

        const digits = toPowerArray(currentNo, base)
        const multiplyResult = digits.reduce(reduce)
        return 1 + multiPer2(multiplyResult, base)
    }
}

/**
 *
 * @type {function(HugeInt, number): number}
 */
const multiPer1 = multiplicativePersistence1(toPowerArray1st)
const multiPer2 = multiplicativePersistence2(toPowerArray2nd)

export default multiPer1