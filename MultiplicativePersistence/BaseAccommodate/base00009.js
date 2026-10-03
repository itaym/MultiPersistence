import {
    getPermutations,
    splitAfterCell,
} from './utils.js'

/**
 * Base-9 skipper: 3·3 and 3·6 give a 0 digit (`9 = 10₉`), so those numbers are skipped.
 *
 * @type {(currentNo: HugeIntEx) => bigint} canonical numbers skipped
 */
// eslint-disable-next-line import-x/prefer-default-export
export const base00009 = (() => {
    /** @type {bigint} scratch result */
    let permutationsSaved

    /**
     * First cell is 3: keeps a single 3.
     *
     * @param {DigitCell} cell3
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn3 = (cell3, currentNo) => {
        if (cell3.count > 1n) {
            permutationsSaved = getPermutations(3n, cell3.count - 1n, 9n)
            splitAfterCell(cell3, 1n, currentNo)
            return permutationsSaved
        }
        return 0n
    }
    /**
     * First cell is 6: skips it when the number has a 3, else keeps a single 6.
     *
     * @param {DigitCell} cell6
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn6 = (cell6, currentNo) => {
        const cell3 = currentNo.getCellOf(3n)

        if (cell3) {
            permutationsSaved = getPermutations(6n, cell6.count, 9n)
            cell6.digit++
            return permutationsSaved
        }

        if (cell6.count > 1n) {
            permutationsSaved = getPermutations(6n, cell6.count - 1n, 9n)
            splitAfterCell(cell6, 1n, currentNo)
            return permutationsSaved
        }
        return 0n
    }
    return currentNo => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 6n:
                return fn6(checkCell, currentNo)
            case 3n:
                return fn3(checkCell, currentNo)
            default:
                return 0n
        }
    }
})()
