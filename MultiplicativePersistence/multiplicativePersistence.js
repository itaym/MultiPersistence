import { digitsValue } from '../Digits/index.js'

/**
 * @typedef {import('../jsdoc-types.d.ts.js').ReduceResults} ReduceResults
 */

/**
 * One reused result object. `multiPer` / `multiPerNBC` / `reduceHI` all write
 * into it and return it; the caller must read what it needs before the next
 * call. Saves one small allocation per search iteration. Safe because
 * `reduceResults` never escapes the loop — `prepareMessage` copies the fields.
 *
 * @type {ReduceResults}
 */
const result = { additionSum: 0n, multiplySum: 0n, productLength: 0, steps: 0 }

/**
 * Digit product of a base-`base` string, in one pass; `0n` on the first `0`
 * digit. `str.includes('0')` is a fast native scan that also covers the common
 * case (a zero ends the persistence chain) without touching BigInt.
 *
 * @param {string} str
 * @returns {BigInt}
 */
function strDigitProduct(str) {
    if (str.includes('0')) return 0n

    let product = 1n
    for (let i = 0; i < str.length; i++) product *= digitsValue[str[i]]
    return product
}

/**
 * Digit product of a HugeInt, written into {@link result}. Walks the cells,
 * refreshing the per-cell `multiplySum` / `additionSum` caches only from the
 * first unchanged cell onward (`cell.changed`).
 *
 * @param {HugeInt} hugeInt
 * @returns {ReduceResults} the shared {@link result}, with `steps = 1`
 */
function reduceHI(hugeInt) {
    let cell = hugeInt.firstCell.next
    let multiplySum, additionSum

    while (cell && cell.changed) cell = cell.next

    cell ?
        (multiplySum = cell.multiplySum, additionSum = cell.additionSum, cell = cell.prev) :
        (multiplySum = 1n, additionSum = 0n, cell = hugeInt.lastCell)

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
 * Multiplicative persistence of a HugeInt. `steps = 0` for a single digit;
 * otherwise delegates to {@link multiPerNBC}.
 *
 * @param {HugeInt} currentNo
 * @param {number} base
 * @returns {ReduceResults} the shared {@link result}
 */
export const multiPer = function (currentNo, base) {
    if (currentNo.isLTBase()) {
        const digit = currentNo.firstCell.digit
        result.additionSum = digit
        result.multiplySum = digit
        result.productLength = 1
        result.steps = 0
        return result
    }

    return multiPerNBC(currentNo, base)
}

/**
 * Multiplicative persistence of a HugeInt, no single-digit check. Runs step 1
 * here ({@link reduceHI}); the step-1 product is stringified once — needed to
 * continue the reduction anyway — so its length is `productLength` for free.
 * Steps 2+ run in {@link multiPer2}.
 *
 * @param {HugeInt} currentNo
 * @param {number} base
 * @returns {ReduceResults} the shared {@link result}
 */
export const multiPerNBC = function (currentNo, base) {
    reduceHI(currentNo)
    const product = result.multiplySum

    if (product < base) {
        result.productLength = 1
        return result
    }

    const str = product.toString(base)
    result.productLength = str.length
    result.steps += 1 + multiPer2(strDigitProduct(str), base)
    return result
}

/**
 * Persistence steps left once `n` is a step-2+ value: keep taking the digit
 * product until it is a single digit.
 *
 * @param {BigInt} n
 * @param {number} base
 * @returns {number}
 */
const multiPer2 = function (n, base) {
    let steps = 0
    while (n >= base) {
        n = strDigitProduct(n.toString(base))
        steps++
    }
    return steps
}
