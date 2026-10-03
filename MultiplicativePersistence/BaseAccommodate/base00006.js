import {
    emptyFunction,
    getPermutations,
} from './utils.js'

/**
 * Base-6 skipper: 2 with 3 and 3 with 4 make a zero product, so the number is skipped.
 *
 * @type {(currentNo: HugeIntEx) => bigint} canonical numbers skipped
 */
// eslint-disable-next-line import-x/prefer-default-export
export const base00006 = (() => {
    /**
     * First cell is 3: skips it when the number has a 2.
     *
     * @param {DigitCell} cell3
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn3 = (cell3, currentNo) => {
        const cell2 = currentNo.getCellOf(2n)
        let permutationsSaved = 0n

        if (cell2) {
            permutationsSaved = getPermutations(3n, cell3.count, 6n)
            cell3.digit++
        }
        return permutationsSaved
    }

    /**
     * First cell is 4: skips it when the number has a 3.
     *
     * @param {DigitCell} cell4
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn4 = (cell4, currentNo) => {
        const cell3 = currentNo.getCellOf(3n)
        let permutationsSaved = 0n

        if (cell3) {
            permutationsSaved = getPermutations(4n, cell4.count, 6n)
            cell4.digit++
        }
        return permutationsSaved
    }

    /** @type {Object<string, (cell: DigitCell, currentNo: HugeIntEx) => bigint>} checker per first-cell digit */
    const checkingFns = {
        1n: emptyFunction,
        2n: emptyFunction,
        3n: fn3,
        4n: fn4,
        5n: emptyFunction,
    }
    return currentNo => {
        const checkCell = currentNo.firstCell
        return checkingFns[checkCell.digit](checkCell, currentNo)
    }
})()
