import {
    getPermutations,
    splitAfterCell,
} from './utils.js'

/**
 * Base-12 skipper: skips numbers whose digit product gets a 0 digit from 3·4-type factors (`12 = 10₁₂`).
 *
 * @type {(currentNo: HugeIntEx) => bigint} canonical numbers skipped
 */
// eslint-disable-next-line import-x/prefer-default-export
export const base00012 = (() => {
    /** @type {bigint} */
    const base = 12n

    /**
     * First cell is 3: skips it when the rest has more than one factor 2.
     *
     * @param {DigitCell} cell3
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn3 = (cell3, currentNo) => {
        let permutationsSaved = 0n

        const countTwoComponents = currentNo.cTCNFC()

        if (countTwoComponents > 1) {
            permutationsSaved = getPermutations(cell3.digit, cell3.count, base)
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
        let permutationsSaved = 0n

        if (currentNo.isCellOf(3n)) {
            permutationsSaved = getPermutations(4n, cell4.count, base)
            cell4.digit++
        }
        return permutationsSaved
    }
    /**
     * First cell is 6: skips it when the number has an even digit, else keeps a single 6.
     *
     * @param {DigitCell} cell6
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn6 = (cell6, currentNo) => {
        let permutationsSaved = 0n

        if (currentNo.hasEvenDigits()) {
            permutationsSaved = getPermutations(cell6.digit, cell6.count, base)
            cell6.digit++
            return permutationsSaved
        }
        if (cell6.count > 1n) {
            permutationsSaved = getPermutations(cell6.digit, cell6.count - 1n, base)
            splitAfterCell(cell6, 1n, currentNo)
        }
        return permutationsSaved
    }
    /**
     * First cell is 8: skips it when the number has a 3 or a 6.
     *
     * @param {DigitCell} cell8
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn8 = (cell8, currentNo) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(3n)) {
            permutationsSaved = getPermutations(cell8.digit, cell8.count, base)
            cell8.digit++
            return permutationsSaved
        }
        if (currentNo.isCellOf(6n)) {
            permutationsSaved = getPermutations(cell8.digit, cell8.count, base)
            cell8.digit++
            return permutationsSaved
        }
        return permutationsSaved
    }
    /**
     * First cell is 9: skips it when the rest has more than one factor 2 or two 6s.
     *
     * @param {DigitCell} cell9
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn9 = (cell9, currentNo) => {
        let permutationsSaved = 0n

        const countTwoComponents = currentNo.cTCNFC()

        if (countTwoComponents > 1n) {
            permutationsSaved = getPermutations(cell9.digit, cell9.count, base)
            cell9.digit++
            return permutationsSaved
        }

        const cell6 = currentNo.getCellOf(6n)
        if (cell6?.count > 1n) {
            permutationsSaved = getPermutations(cell9.digit, cell9.count, base)
            cell9.digit++
            return permutationsSaved
        }
        return permutationsSaved
    }
    /**
     * First cell is 10: skips it when the rest has a factor 2 and a 3 or 9, or when the number has a 6.
     *
     * @param {DigitCell} cellA
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn10 = (cellA, currentNo) => {
        let permutationsSaved = 0n

        const countTwoComponents = currentNo.cTCNFC()

        if (countTwoComponents) {
            if (currentNo.isCellOf(9n)) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
                cellA.digit++
                return permutationsSaved
            }
            if (currentNo.isCellOf(3n)) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
                cellA.digit++
                return permutationsSaved
            }
        }
        if (currentNo.isCellOf(6n)) {
            permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
            cellA.digit++
            return permutationsSaved
        }

        return permutationsSaved
    }

    return currentNo => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 11n: return 0n
            case 10n: return fn10(checkCell, currentNo)
            case 9n: return fn9(checkCell, currentNo)
            case 8n: return fn8(checkCell, currentNo)
            case 7n: return 0n
            case 6n: return fn6(checkCell, currentNo)
            case 5n: return 0n
            case 4n: return fn4(checkCell, currentNo)
            case 3n: return fn3(checkCell, currentNo)
            default: return 0n
        }
    }
})()
