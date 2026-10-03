import {
    getPermutations,
    splitAfterCell,
} from './utils.js'

/**
 * Base-8 skipper: runs of 2, 4 and 6 that would give a 0 digit (`8 = 10₈`) are skipped.
 *
 * @type {(currentNo: HugeIntEx) => bigint} canonical numbers skipped
 */
// eslint-disable-next-line import-x/prefer-default-export
export const base00008 = (() => {
    /**
     * First cell is 2: keeps at most two 2s.
     *
     * @param {DigitCell} cell2
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn2 = (cell2, currentNo) => {
        let permutationsSaved = 0n

        if (cell2.count > 2n) {
            permutationsSaved = getPermutations(2n, cell2.count - 2n, 8n)
            splitAfterCell(cell2, 2n, currentNo)
        }
        return permutationsSaved
    }
    /**
     * First cell is 4: skips it when the number has a 2, else keeps a single 4.
     *
     * @param {DigitCell} cell4
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn4 = (cell4, currentNo) => {
        const cell2 = currentNo.getCellOf(2n)
        let permutationsSaved = 0n

        if (cell2) {
            permutationsSaved = getPermutations(4n, cell4.count, 8n)
            cell4.digit++
        } else if (cell4.count > 1n) {
            permutationsSaved = getPermutations(4n, cell4.count - 1n, 8n)
            splitAfterCell(cell4, 1n, currentNo)
        }
        return permutationsSaved
    }
    /**
     * First cell is 6: skips it when the number has a 4 or two 2s, else keeps at most two 6s.
     *
     * @param {DigitCell} cell6
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn6 = (cell6, currentNo) => {
        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        let permutationsSaved = 0n

        if (cell4 || cell2?.count > 1n) {
            permutationsSaved = getPermutations(6n, cell6.count, 8n)
            cell6.digit++
        } else if (cell6.count > 2n) {
            permutationsSaved = getPermutations(6n, cell6.count - 2n, 8n)
            splitAfterCell(cell6, 2n, currentNo)
        }
        return permutationsSaved
    }

    /** @type {Object<string, (cell: DigitCell, currentNo: HugeIntEx) => bigint>} checker per even first-cell digit */
    const checkingFns = {
        2n: fn2,
        4n: fn4,
        6n: fn6,
    }
    return currentNo => {
        const checkCell = currentNo.firstCell

        let permutationsSaved = 0n

        if (!(checkCell.digit % 2n)) {
            permutationsSaved = checkingFns[checkCell.digit](checkCell, currentNo)
        }
        return permutationsSaved
    }
})()
