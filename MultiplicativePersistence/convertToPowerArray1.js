import { digitsValue } from '../Digits/index.js'

/**
 *
 * @param arr {string} Representing a bigint number
 * @return {DigitCell[]}
 */
function convertToPowerArray1(arr) {
    const result = []
    let endIndex = 0
    let startIndex = 0

    while (startIndex < arr.length) {
        const digit = arr[endIndex]
        endIndex = arr.lastIndexOf(digit) + 1
        result.push(digitsValue[digit] ** BigInt(endIndex - startIndex))
        startIndex = endIndex
    }
    return result
}