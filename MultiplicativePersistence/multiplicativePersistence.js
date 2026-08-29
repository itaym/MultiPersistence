import { digitsValue } from '../Digits/index.js'

const arrayWithZero = [0n]
/**
 * Converts a BigInt into an array of digit values in the given base.
 *
 * Returns `[0n]` if the number contains a zero digit; otherwise returns
 * an array of digit values.
 *
 * @param {BigInt} currentNo
 *     Number to convert.
 *
 * @param {number} base
 *     Numerical base.
 *
 * @returns {BigInt[]}
 *     Array of digit values or `[0n]` if zero is present.
 */
function BIStrArr(currentNo, base) {
    let currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    const strArray = currentNoStr.split('')
    const result = []

    for (var x = 0; x < strArray.length; x++) {
        result[x] = digitsValue[strArray[x]]
    }

    return result
}

/**
 * Multiplies all elements of a digit array.
 *
 * @param {Array<BigInt|number>} arr
 *     Array of digit values.
 *
 * @returns {BigInt|number}
 *     Product of all digits.
 */
function reduce(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
}

/**
 * Computes the digit product of a HugeInt using cached cell results.
 *
 * Traverses digit‑cells, updating cached multiplication and addition sums
 * only for changed cells.
 *
 * @param {HugeInt} hugeInt
 *     HugeInt to reduce.
 *
 * @returns {ReduceResults}
 *     Digit product and accumulated sums.
 */
function reduceHI(hugeInt) {
    let cell = hugeInt.firstCell.next
    let multiplySum, additionSum

    while (cell && cell.changed) cell = cell.next

    cell ?
        (multiplySum = cell.multiplySum, additionSum = cell.additionSum, cell = cell.prev) :
        (multiplySum = 1n, additionSum = 0n, cell = hugeInt.lastCell)

    do {
        multiplySum *= cell.digit ** cell.count
        additionSum += cell.digit * cell.count
        cell.additionSum = additionSum
        cell.changed = false
        cell.multiplySum = multiplySum

        cell = cell.prev
    } while (cell)

    return {
        additionSum,
        multiplySum,
        steps: 1
    }
}

/**
 * Computes multiplicative persistence for a HugeInt.
 *
 * Returns 0 for single‑digit values; otherwise delegates to multiPerNBC.
 *
 * @param {HugeInt} currentNo
 *     Number to reduce.
 *
 * @param {number} base
 *     Numerical base.
 *
 * @returns {ReduceResults}
 *     Persistence result.
 */
export const multiPer = function (currentNo, base) {
    if (currentNo.isLTBase()) {
        return {
            additionSum: currentNo.firstCell.digit,
            multiplySum: currentNo.firstCell.digit,
            steps: 0,
        }
    }

    return multiPerNBC(currentNo, base)
}

/**
 * Computes multiplicative persistence for a HugeInt without base‑case checks.
 *
 * Uses reduceHI and recursively reduces the resulting BigInt.
 *
 * @param {HugeInt} currentNo
 *     HugeInt to reduce.
 *
 * @param {number} base
 *     Numerical base.
 *
 * @returns {ReduceResults}
 *     Persistence result.
 */
export const multiPerNBC = function (currentNo, base) {
    const reduceResult = reduceHI(currentNo)
    reduceResult.steps += multiPer2(reduceResult.multiplySum, base)
    return reduceResult
}

/**
 * Recursively computes multiplicative persistence for BigInt values.
 *
 * @param {BigInt} currentNo
 *     Number to reduce.
 *
 * @param {number} base
 *     Numerical base.
 *
 * @returns {number}
 *     Persistence steps.
 */
const multiPer2 = function (currentNo, base) {
    if (currentNo < base) return 0
    return 1 + multiPer2(reduce(BIStrArr(currentNo, base)), base)
}
