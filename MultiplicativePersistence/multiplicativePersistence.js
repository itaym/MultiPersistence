import { digitsValue } from '../Digits/index.js'

const arrayWithZero = [0n]
/**
 *
 * @param currentNo { bigint }
 * @param base { number }
 * @return { bigint[]|*[] }
 */
function BIStrArr(currentNo, base) {
    let currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    const result = currentNoStr.split('')

    for (var x = 0; x < result.length; x++) {
        result[x] = digitsValue[result[x]]
    }
    return result
}

/**
 *
 * @param arr { number[] | bigint[] }
 * @return {*}
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
 * @param hugeInt { HugeInt }
 * @return {bigint}
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
 * @param currentNo { HugeInt }
 * @param base { number }
 * @return { number }
 */
export const multiPer = function (currentNo, base) {
    if (currentNo.isLTBase()) return 0

    return multiPerNBC(currentNo, base)
}

/**
 *
 * @param currentNo { HugeInt }
 * @param base { number }
 * @return {number}
 */
export const multiPerNBC = function (currentNo, base) {

    return 1 + multiPer2(reduceHI(currentNo), base)
}

/**
 *
 * @param currentNo { bigint }
 * @param base { number }
 * @return {number}
 */
const multiPer2 = function (currentNo, base) {
    if (currentNo < base) return 0

    return 1 + multiPer2(reduce(BIStrArr(currentNo, base)), base)
}
