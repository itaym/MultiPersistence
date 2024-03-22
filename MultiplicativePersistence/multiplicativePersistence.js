import { digitsValue } from '../Digits/index.js'

const arrayWithZero = [0n]

/**
 *
 * @param currentNo { bigint }
 * @param base { number }
 * @return { bigint[]|*[] }
 */
function bigIntCreateDigitsArray(currentNo, base) {
    let currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    const result = currentNoStr.split('')

    for (var x = 0; x < result.length; x++) {
        result[x] = digitsValue[result[x]]
    }
    return result
}

function reduce(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
}

function reduceHugeInt(hugeInt) {
    let lastResult = 1n
    const arr = hugeInt.cellsArr
    let startIndex = hugeInt.startIndex + 1

    while ((startIndex < arr.length) && arr[startIndex].changed) {
        startIndex++
    }
    if (startIndex < arr.length) {
        lastResult =  arr[startIndex].result
    }
    startIndex--
    for (; startIndex >= hugeInt.startIndex; startIndex--) {
        lastResult *= arr[startIndex].digit ** arr[startIndex].count
        arr[startIndex].changed = false
        arr[startIndex].result = lastResult
    }
    return lastResult
}

export const multiPer = function (currentNo, base) {
    if (currentNo.isLTBase()) return 0

    return multiPerNoBaseCheck(currentNo, base)
}
export const multiPerNoBaseCheck = function (currentNo, base) {

    return 1 + multiPer2(reduceHugeInt(currentNo), base)
}

const multiPer2 = function (currentNo, base) {
    if (currentNo < base) return 0

    const digits = bigIntCreateDigitsArray(currentNo, base)
    return 1 + multiPer2(reduce(digits), base)
}
