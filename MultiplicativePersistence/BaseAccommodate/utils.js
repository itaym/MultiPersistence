import countPer from '#permutations/countPermutations.js'
import memorize from '#utils/memorize.js'

/**
 * Splits `cell` so `countToLeave` digits stay and bumps the digit of the split-off rest.
 *
 * @param {DigitCell} cell
 * @param {bigint} countToLeave
 * @param {HugeIntEx} hugeInt owner of `cell`
 * @returns {void}
 */
export const splitAfterCell = (cell, countToLeave, hugeInt) => {
    const newCell = hugeInt.splitCellBefore(cell, cell.count - countToLeave)
    newCell.digit++
}

/**
 * Canonical numbers skipped by bumping a run of `countChange` copies of `digit`; disk-memorized.
 *
 * @type {(digit: bigint, countChange: bigint, base: bigint) => bigint}
 */
export const getPermutations = memorize((digit, countChange, base) => {
    if (countChange === 1n) return 1n
    return countPer(countChange - 1n, base - digit) -
        countPer(countChange - 2n, base - digit)
}, 'getPermutations')

/**
 * Checker for digits with nothing to skip.
 *
 * @returns {bigint} `0n`
 */
export const emptyFunction = () => 0n
