import { digitsValue } from '../Digits/index.js'

const arrayWithZero = [0n]
/**
 *
 * @param currentNo { bigint }
 * @param base { number }
 * @return { bigint[] }
 */
function BIStrArr(currentNo, base) {
    let currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    const result = /** @type {bigint[]} */ currentNoStr.split('')

    for (var x = 0; x < result.length; x++) {
        result[x] = digitsValue[result[x]]
    }
    return result
}

/**
 *
 * @param arr {bigint[]}
 * @returns {*}
 */
function reduce(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
}

/**
 *
 * @param hugeInt {HugeInt}
 * @returns {bigint}
 */
function reduceHI(hugeInt) {
    let cell = hugeInt.firstCell.next, lastResult

    while (cell && cell.changed) cell = cell.next

    cell ?
        (lastResult = cell.result, cell = cell.prev) :
        (lastResult = 1n, cell = hugeInt.lastCell)

    do {
        lastResult *= cell.digit ** cell.count
        cell.changed = false
        cell.result = lastResult
        cell = cell.prev
    } while (cell)

    return lastResult
}

/**
 *
 * @param {HugeInt} currentNo
 * @param {bigint} base
 * @returns {*|number}
 */
export const multiPer = function (currentNo, base) {
    if (currentNo.isLTBase()) return 0

    return multiPerNBC(currentNo, base)
}

/**
 *
 * @param {HugeInt} currentNo
 * @param {bigint} base
 * @returns {*|number}
 */
export const multiPerNBC = function (currentNo, base) {

    return 1 + multiPer2(reduceHI(currentNo), base)
}

/**
 *
 * @param {bigint} currentNo
 * @param {bigint} base
 * @returns {*|number}
 */
const multiPer2 = function (currentNo, base) {
    if (currentNo < base) return 0

    return 1 + multiPer2(reduce(BIStrArr(currentNo, base)), base)
}
