import memorize from '../../utils/memorize.js'
import countPer from '../../permutations/countPermutations.js'

/**
 * Splits `cell`, leaving `countToLeave` digits in it, and increments the new cell's digit.
 *
 * @param {HugeInt} hugeInt
 * @param {DigitCell} cell
 * @param {BigInt} countToLeave digits to keep in the original cell
 * @returns {void}
 */
export const splitAfterCell = (hugeInt, cell, countToLeave) => {
    const newCell = hugeInt.splitCellBefore(cell, cell.count - countToLeave)
    newCell.digit++
}

/**
 * Permutations skipped after a digit mutation. Memoized.
 *
 * @param {BigInt} digit the digit being modified
 * @param {BigInt} countChange digit copies affected
 * @param {BigInt} base
 * @returns {BigInt}
 */
export const getPermutations = memorize((digit, countChange, base) => {
    if (countChange === 1n) return 1n
    return countPer(countChange - 1n, base - digit) -
        countPer(countChange - 2n, base - digit)
}, 'getPermutations')

/**
 * Placeholder for digits without pruning rules; always `0n`.
 *
 * @returns {BigInt}
 */
export const emptyFunction = () => 0n
