import { getPermutations } from './utils.js'

/**
 * Base-10 skipper: a 5 with any even digit makes a zero product, so the number is skipped.
 *
 * @type {(currentNo: HugeIntEx) => bigint} canonical numbers skipped
 */
// eslint-disable-next-line import-x/prefer-default-export
export const base00010 = (() => {
    /** @type {bigint} scratch result */
    let permutationsSaved

    /**
     * First cell is 5: skips it when the number has an even digit.
     *
     * @param {DigitCell} cell5
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn5 = (cell5, currentNo) => {
        if (currentNo.hasEvenDigits()) {
            permutationsSaved = getPermutations(5n, cell5.count, 10n)
            cell5.digit++
            return permutationsSaved
        }
        return 0n
    }
    /**
     * First cell is even: skips it when the number has a 5.
     *
     * @param {DigitCell} checkCell
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fnEven = (checkCell, currentNo) => {
        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(checkCell.digit, checkCell.count, 10n)
            checkCell.digit++
            return permutationsSaved
        }
        return 0n
    }
    return currentNo => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 8n: return fnEven(checkCell, currentNo)
            case 6n: return fnEven(checkCell, currentNo)
            case 5n: return fn5(checkCell, currentNo)
            default: return 0n
        }
    }
})()
