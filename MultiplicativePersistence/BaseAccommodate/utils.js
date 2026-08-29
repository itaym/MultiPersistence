import memorize from '../../utils/memorize.js'
import countPer from '../../permutations/countPermutations.js'

/**
 * Splits a digit‑cell and increments the digit of the newly created cell.
 *
 * Creates a new cell before the given cell, keeping `countToLeave` digits
 * in the original cell and incrementing the digit of the new cell.
 *
 * @param {HugeInt} hugeInt
 *     The HugeInt instance.
 *
 * @param {DigitCell} cell
 *     The cell to split.
 *
 * @param {BigInt} countToLeave
 *     Number of digits to keep in the original cell.
 *
 * @returns {void}
 */
export const splitAfterCell = (hugeInt, cell, countToLeave) => {
    const newCell = hugeInt.splitCellBefore(cell, cell.count - countToLeave)
    newCell.digit++
}

/**
 * Computes the number of permutations skipped after a digit mutation.
 *
 * Uses a combinatorial shortcut based on digit, countChange, and base.
 * The result is memoized.
 *
 * @param {BigInt} digit
 *     The digit being modified.
 *
 * @param {BigInt} countChange
 *     Number of digit copies affected.
 *
 * @param {BigInt} base
 *     The numeric base.
 *
 * @returns {BigInt}
 *     Number of skipped permutations.
 */
export const getPermutations = memorize((digit, countChange, base) => {
    if (countChange === 1n) return 1n
    return countPer(countChange - 1n, base - digit) -
        countPer(countChange - 2n, base - digit)
}, 'getPermutations')

/**
 * A placeholder function for digits without pruning rules.
 *
 * @returns {BigInt}
 *     Always returns 0n.
 */
export const emptyFunction = () => 0n
