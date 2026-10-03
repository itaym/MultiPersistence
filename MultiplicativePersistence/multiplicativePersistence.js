import { digitsValue } from '#Digits/index.js'

/** @type {ReduceResults} shared result, overwritten by every call */
const result = { additionSum: 0n, multiplySum: 0n, productLength: 0, steps: 0 }

/**
 * Product of the digits of `str` (via {@link digitsValue}).
 *
 * @param {string} str
 * @returns {bigint}
 */
const strDigitProduct = str => {
    if (str.includes('0')) return 0n

    let product = 1n
    for (let i = 0; i < str.length; i++) product *= digitsValue[str[i]]
    return product
}

/**
 * First step on the digit cells: digit product and sum, reusing sums cached on unchanged cells.
 *
 * @param {HugeIntEx} hugeInt
 * @returns {ReduceResults} the shared result
 */
const reduceHI = hugeInt => {
    let cell = hugeInt.firstCell.next
    let multiplySum
    let additionSum

    while (cell && cell.changed) cell = cell.next

    cell
        // eslint-disable-next-line prefer-destructuring
        ? (multiplySum = cell.multiplySum, additionSum = cell.additionSum, cell = cell.prev)
        : (multiplySum = 1n, additionSum = 0n, cell = hugeInt.lastCell)

    do {
        // count === 1n every time the least-significant run is a lone digit,
        // which is the usual shape after addOneToSorted — skip the `**` builtin.
        multiplySum *= cell.count === 1n ? cell.digit : cell.digit ** cell.count
        additionSum += cell.digit * cell.count
        cell.additionSum = additionSum
        cell.changed = false
        cell.multiplySum = multiplySum

        cell = cell.prev
    } while (cell)

    result.additionSum = additionSum
    result.multiplySum = multiplySum
    result.steps = 1
    return result
}

/**
 * Multiplicative persistence of `currentNo`, handling single-digit numbers.
 *
 * @param {number} base
 * @param {HugeIntEx} currentNo
 * @returns {ReduceResults} the shared result
 */
export const multiPer = (base, currentNo) => {
    if (currentNo.isLTBase()) {
        const { digit } = currentNo.firstCell
        result.additionSum = digit
        result.multiplySum = digit
        result.productLength = 1
        result.steps = 0
        return result
    }

    return multiPerNBC(base, currentNo)
}

/**
 * Multiplicative persistence of `currentNo`; assumes at least two digits.
 *
 * @param {number} base
 * @param {HugeIntEx} currentNo
 * @returns {ReduceResults} the shared result
 */
export const multiPerNBC = (base, currentNo) => {
    reduceHI(currentNo)
    const product = result.multiplySum

    if (product < base) {
        result.productLength = 1
        return result
    }

    const str = product.toString(base)
    result.productLength = str.length
    result.steps += 1 + multiPer2(base, strDigitProduct(str))
    return result
}

/**
 * Steps until `product` is a single digit.
 *
 * @param {number} base
 * @param {bigint} product
 * @returns {number}
 */
const multiPer2 = (base, product) => {
    let steps = 0
    while (product >= base) {
        product = strDigitProduct(product.toString(base))
        steps++
    }
    return steps
}
