import { digitsValue } from '../Digits/index.js'

const arrayWithZero = [0n]

/**
 * Digit values of a base-`base` string, or `[0n]` if it contains a zero digit.
 *
 * @param {string} str
 * @returns {BigInt[]}
 */
function strToDigits(str) {
    if (str.includes('0')) return arrayWithZero

    const result = []
    for (let x = 0; x < str.length; x++) result[x] = digitsValue[str[x]]
    return result
}

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
    return strToDigits(currentNo.toString(base))
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
            productLength: 1,
            steps: 0,
        }
    }

    return multiPerNBC(currentNo, base)
}

/**
 * Computes multiplicative persistence for a HugeInt without base‑case checks.
 *
 * Runs step 1 here ({@link reduceHI}) so the string form of the step-1 product
 * — built anyway to continue the reduction — can be measured for `productLength`
 * without a second `toString`. Steps 2+ recurse through {@link multiPer2}.
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
    const product = reduceResult.multiplySum

    if (product < base) {
        reduceResult.productLength = 1
        return reduceResult
    }

    const str = product.toString(base)
    reduceResult.productLength = str.length
    reduceResult.steps += 1 + multiPer2(reduce(strToDigits(str)), base)
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
