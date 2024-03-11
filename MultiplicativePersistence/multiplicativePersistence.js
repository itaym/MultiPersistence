import { digitsValue } from '../Digits/index.js'
import powerBy from '../utils/powerBy.js'

const convertToPowerArray = (() => {
    const splitRegEx = /((.)\2*)/g
    const  tbi = []
    for (let int = 0; int < 1_000; int++) {
        tbi.push(BigInt(int))
    }
    return function (str) {
        const result = []
        const arr = str.split('').sort().join('').match(splitRegEx) || ['1']

        for (let str of arr) {
            result.push(powerBy(digitsValue[str[0]], tbi[str.length]))
        }
        return result
    }
})()

const arrayWithZero = [0n]
const replace1RegEx = /1/g

/**
 *
 * @param currentNo { bigint }
 * @param base { number }
 * @return { bigint[] }
 */
function bigIntCreatePowerArray(currentNo, base) {
    let currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    currentNoStr = currentNoStr.replace(replace1RegEx, '')

    return convertToPowerArray(currentNoStr)
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

    for (let x =  startIndex - 1; x >= hugeInt.startIndex; x--) {
        let cell = arr[x]
        lastResult *= powerBy(cell.digit, cell.count)
        cell.changed = false
        cell.result = lastResult
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

    const digits = bigIntCreatePowerArray(currentNo, base)
    return 1 + multiPer2(reduce(digits), base)
}
