import memorize from '../../utils/memorize.js'
import countPer from '../../permutations/countPermutations.js'

/**
 * Split a DigitCell inside a HugeInt and increment the digit of the newly
 * created cell.
 *
 * This operation is used by base‑accommodation modules when a digit appears
 * too many times. The function splits the given cell so that `countToLeave`
 * units remain in the original cell, while the remaining units are moved into
 * a new cell created immediately before it. The new cell's digit is then
 * incremented.
 *
 * Structural guarantees:
 *  - HugeInt remains in canonical sorted order.
 *  - No adjacent cells share the same digit.
 *  - Only one new DigitCell is created.
 *
 * @param {HugeInt} hugeInt
 *     The HugeInt instance containing the cell to split.
 *
 * @param {DigitCell} cell
 *     The cell to split. Must be part of `hugeInt`.
 *
 * @param {BigInt} countToLeave
 *     Number of digit copies to keep in the original cell.
 *
 * @returns {void}
 */
export const splitAfterCell = (hugeInt, cell, countToLeave) => {
    const newCell = hugeInt.splitCellBefore(cell, cell.count - countToLeave)
    newCell.digit++
}


/**
 * Compute the number of permutations skipped when a base‑accommodation rule
 * mutates a HugeInt.
 *
 * This function implements a specific combinatorial shortcut used throughout
 * the persistence search engine. It determines how many permutations become
 * irrelevant after a digit increment or cell split.
 *
 * Formula:
 *   If countChange === 1 → return 1n
 *   Otherwise:
 *     countPer(countChange - 1, base - digit)
 *       minus
 *     countPer(countChange - 2, base - digit)
 *
 * Memoization:
 *  - The function is memoized because bases, digits, and countChange values
 *    repeat frequently during persistence exploration.
 *
 * @param {BigInt} digit
 *     The digit being modified.
 *
 * @param {BigInt} countChange
 *     Number of digit copies affected by the mutation.
 *
 * @param {BigInt} base
 *     The numeric base (e.g., 10n, 12n, 16n).
 *
 * @returns {BigInt}
 *     Number of permutations skipped due to the mutation.
 */
export const getPermutations = memorize((digit, countChange, base) => {
    if (countChange === 1n) return 1n
    return countPer(countChange - 1n, base - digit) -
        countPer(countChange - 2n, base - digit)
}, 'getPermutations')

/**
 * A no‑op placeholder function used by base‑accommodation modules when a digit
 * has no associated pruning rule.
 *
 * @returns {BigInt}
 *     Always returns 0n.
 */
export const emptyFunction = () => 0n
