import memorize from "../../utils/memorize.js";
import countPer from "../../permutations/countPermutations.js";

export const splitAfterCell = (hugeInt, cell, countToLeave) => {
    const newCell = hugeInt.splitCellBefore(cell ,cell.count - countToLeave)
    newCell.digit++
}

export const getPermutations = memorize((digit, countChange, base) => {
    if (countChange === 1n) return 1n
    return countPer(countChange - 1n, base - digit) -
        countPer(countChange - 2n, base - digit)
}, 'getPermutations')

export const emptyFunction = () => 0n