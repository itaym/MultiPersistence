import { digitsValue } from '../Digits/index.js'

/**
 *
 * @param value { bigint }
 * @param powerBy { bigint }
 * @returns { bigint }
 */
const powerBigInt = (value, powerBy) => {
    return value ** powerBy
}
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
 * @param arr {string[]} Representing a bigint number
 * @return {DigitCell[]}
 */
function convertToDigitsCells(arr) {
    const result = []
    let endIndex = 0
    let startIndex = 0

    while (startIndex < arr.length) {
        const digit = arr[endIndex]
        endIndex = arr.lastIndexOf(digit) + 1
        result.push({ digit:digitsValue[digit], count: BigInt(endIndex - startIndex) })
        startIndex = endIndex
    }
    return result
}
/**
 *
 * @param arr {string[]}
 * @return {DigitCell[]}
 */
const bigIntCreatePowerArray = arr => {
    // const digitsArr = bigIntStr.match(/((.)\2*)/g)
    const digitCells = convertToDigitsCells(arr)
    return digitCells.map(
        ({digit, count}) => powerBigInt(digit, count)
    )
}
/**
 *
 * @param currentNo {HugeInt}
 * @return {DigitCell[]}
 */
const toPowerArray1st = (currentNo) => hugeIntCreatePowerArray(currentNo)
/**
 *
 * @type {number[]}
 */
const arrayWithZero = [0]
/**
 *
 * @param currentNo {bigint}
 * @param base
 * @return {[number]|(bigint|*)[]}
 */
const toPowerArray2nd = (currentNo, base) => {
    const currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    return bigIntCreatePowerArray(currentNoStr.split('').sort())
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
        return 1 + multiPer2(digits.reduce(reduce), base)
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
        return 1 + multiPer2(digits.reduce(reduce), base)
    }
}
/**
 *
 * @type {function(HugeInt, number): number}
 */
const multiPer1 = multiplicativePersistence1(toPowerArray1st)
const multiPer2 = multiplicativePersistence2(toPowerArray2nd)

export default multiPer1