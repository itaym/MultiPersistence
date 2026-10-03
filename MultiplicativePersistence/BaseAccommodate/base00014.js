import { getPermutations } from './utils.js'

/**
 * Base-14 skipper: a 7 with any even digit makes a zero product, so the number is skipped.
 *
 * @type {(currentNo: HugeIntEx) => bigint} canonical numbers skipped
 */
// eslint-disable-next-line import-x/prefer-default-export
export const base00014 = (() => {
    /** @type {bigint} scratch result */
    let permutationsSaved

    /**
     * First cell is 7: skips it when the number has an even digit.
     *
     * @param {DigitCell} cell7
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn7 = (cell7, currentNo) => {
        if (currentNo.hasEvenDigits()) {
            permutationsSaved = getPermutations(7n, cell7.count, 14n)
            cell7.digit++
            return permutationsSaved
        }
        return 0n
    }
    /**
     * First cell is even: skips it when the number has a 7.
     *
     * @param {DigitCell} checkCell
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fnEven = (checkCell, currentNo) => {
        if (currentNo.isCellOf(7n)) {
            permutationsSaved = getPermutations(checkCell.digit, checkCell.count, 14n)
            checkCell.digit++
            return permutationsSaved
        }
        return 0n
    }
    return currentNo => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 12n: return fnEven(checkCell, currentNo)
            case 10n: return fnEven(checkCell, currentNo)
            case 8n: return fnEven(checkCell, currentNo)
            case 7n: return fn7(checkCell, currentNo)
            default: return 0n
        }
    }
})()
