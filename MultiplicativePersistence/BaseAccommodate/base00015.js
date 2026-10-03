import { getPermutations } from './utils.js'

/**
 * Base-15 skipper: 3·5 and 5·(6, 9, 12) make a zero product, so those numbers are skipped.
 *
 * @type {(currentNo: HugeIntEx) => bigint} canonical numbers skipped
 */
// eslint-disable-next-line import-x/prefer-default-export
export const base00015 = (() => {
    /** @type {bigint} */
    const base = 15n

    /**
     * First cell is 5: skips it when the number has a 3.
     *
     * @param {DigitCell} cell5
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn5 = (cell5, currentNo) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(3n)) {
            permutationsSaved = getPermutations(5n, cell5.count, base)
            cell5.digit++
            cell5.change = true
        }
        return permutationsSaved
    }
    /**
     * First cell is 6: skips it when the number has a 5.
     *
     * @param {DigitCell} cell6
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn6 = (cell6, currentNo) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(6n, cell6.count, base)
            cell6.digit++
            cell6.change = true
        }
        return permutationsSaved
    }
    /**
     * First cell is 9: skips it when the number has a 5.
     *
     * @param {DigitCell} cell9
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn9 = (cell9, currentNo) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(9n, cell9.count, base)
            cell9.digit++
            cell9.change = true
        }
        return permutationsSaved
    }
    /**
     * First cell is 12: skips it when the number has a 5.
     *
     * @param {DigitCell} cell12
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn12 = (cell12, currentNo) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(12n, cell12.count, base)
            cell12.digit++
            cell12.change = true
        }
        return permutationsSaved
    }
    return currentNo => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 14n: return 0n
            case 13n: return 0n
            case 12n: return fn12(checkCell, currentNo)
            case 11n: return 0n
            case 10n: return 0n
            case 9n: return fn9(checkCell, currentNo)
            case 8n: return 0n
            case 7n: return 0n
            case 6n: return fn6(checkCell, currentNo)
            case 5n: return fn5(checkCell, currentNo)
            default: return 0n
        }
    }
})()
