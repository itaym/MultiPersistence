import { digitsValue } from '../Digits/index.js'

const arrayWithZero = [0n]
/**
 * Converts a BigInt into an array of digit values in the given base.
 *
 * Behavior:
 *  - Converts the BigInt to a base-N string using `currentNo.toString(base)`.
 *  - If the resulting string contains the character '0', returns the shared
 *    sentinel array `[0n]` to indicate that the number contains a zero digit.
 *    This allows the caller to short‑circuit multiplicative persistence logic.
 *  - Otherwise splits the string into characters and maps each character to its
 *    numeric digit value using `digitsValue`.
 *
 * Performance notes:
 *  - String conversion is significantly cheaper than converting a BigInt into
 *    HugeInt or performing repeated division.
 *  - Returning `[0n]` is a fast zero‑detection mechanism and avoids allocating
 *    a full digit array.
 *
 * @param {BigInt} currentNo
 *     The number to convert into digit values.
 *
 * @param {number} base
 *     Numerical base used for conversion.
 *
 * @returns {BigInt[]}
 *     Array of digit values, or `[0n]` if the number contains zero.
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
 * Multiplies all elements of a digit array together.
 *
 * Behavior:
 *  - Starts with the first element.
 *  - Sequentially multiplies each subsequent element.
 *
 * Performance notes:
 *  - No early exit is performed; callers should ensure that zero detection
 *    happens earlier if needed.
 *
 * @param {Array<BigInt|number>} arr
 *     Array of digit values to multiply.
 *
 * @returns {BigInt|number}
 *     The product of all digits in the array.
 */
function reduce(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
}

/**
 * Computes the multiplicative product of all digits in a HugeInt.
 *
 * Behavior:
 *  - Traverses the HugeInt digit-cell structure from most-significant to
 *    least-significant digit.
 *  - Uses the `changed` flag and cached `result` field to avoid recomputing
 *    products for cells that have not changed since the last reduction.
 *  - For each changed cell, multiplies:
 *        digit ** count
 *    and updates both `changed` and `result`.
 *
 * Purpose:
 *  - This is the optimized multiplication engine for HugeInt-based persistence.
 *  - It avoids repeated full-digit parsing and leverages structural caching.
 *
 * Performance notes:
 *  - Complexity is proportional to the number of changed cells, not total cells.
 *  - This makes it significantly faster than recomputing the full product.
 *
 * @param {HugeInt} hugeInt
 *     The HugeInt instance whose digit product is computed.
 *
 * @returns {BigInt}
 *     The product of all digits in the HugeInt.
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
 * Computes the multiplicative persistence of a HugeInt.
 *
 * Behavior:
 *  - If the number is a single digit (`isLTBase()`), returns 0.
 *  - Otherwise delegates to `multiPerNBC`, which performs the actual reduction.
 *
 * Purpose:
 *  - Entry point for persistence calculation on HugeInt values.
 *
 * @param {HugeInt} currentNo
 *     The number whose persistence is being computed.
 *
 * @param {number} base
 *     Numerical base used for digit interpretation.
 *
 * @returns {number}
 *     Number of multiplicative steps required to reach a single digit.
 */
export const multiPer = function (currentNo, base) {
    if (currentNo.isLTBase()) return 0

    return multiPerNBC(currentNo, base)
}

/**
 * Computes multiplicative persistence for a HugeInt without performing
 * the single-digit base-case check.
 *
 * Behavior:
 *  - Computes the product of digits using `reduceHI`.
 *  - Passes the resulting BigInt to `multiPer2` for recursive reduction.
 *  - Adds 1 to account for the multiplication step performed here.
 *
 * Purpose:
 *  - Internal engine for persistence on HugeInt values.
 *
 * @param {HugeInt} currentNo
 *     The HugeInt to reduce.
 *
 * @param {number} base
 *     Numerical base used for digit interpretation.
 *
 * @returns {number}
 *     Persistence count excluding the initial base-case check.
 */
export const multiPerNBC = function (currentNo, base) {

    return 1 + multiPer2(reduceHI(currentNo), base)
}

/**
 * Recursively computes multiplicative persistence for BigInt values.
 *
 * Behavior:
 *  - If the number is a single digit (< base), returns 0.
 *  - Otherwise:
 *      - Converts the BigInt into digit values using `BIStrArr`.
 *      - Multiplies the digits using `reduce`.
 *      - Recursively calls itself on the resulting BigInt.
 *      - Adds 1 to account for the multiplication step.
 *
 * Purpose:
 *  - Core recursive engine for persistence on plain BigInt values.
 *  - Used after HugeInt has been reduced to a BigInt.
 *
 * Performance notes:
 *  - Depth of recursion corresponds to persistence value.
 *  - Each step performs digit parsing and multiplication.
 *
 * @param {BigInt} currentNo
 *     The BigInt to reduce.
 *
 * @param {number} base
 *     Numerical base used for digit interpretation.
 *
 * @returns {number}
 *     Number of multiplicative steps required to reach a single digit.
 */
const multiPer2 = function (currentNo, base) {
    if (currentNo < base) return 0

    return 1 + multiPer2(reduce(BIStrArr(currentNo, base)), base)
}
