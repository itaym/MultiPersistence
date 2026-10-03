import {
    getPermutations,
    splitAfterCell,
} from './utils.js'

/**
 * Base-16 skipper: caps runs of even digits whose factors of 2 would give a 0 digit (`16 = 10₁₆`).
 *
 * @type {(currentNo: HugeIntEx) => bigint} canonical numbers skipped
 */
// eslint-disable-next-line import-x/prefer-default-export
export const base00016 = (() => {
    /** @type {bigint} */
    const base = 16n

    /**
     * First cell is 2: keeps at most three 2s.
     *
     * @param {DigitCell} cell2
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn2 = (cell2, currentNo) => {
        let permutationsSaved = 0n

        if (cell2.count > 3n) {
            permutationsSaved = getPermutations(2n, cell2.count - 3n, base)
            splitAfterCell(cell2, 3n, currentNo)
        }
        return permutationsSaved
    }
    /**
     * First cell is 4: skips it when the number has two 2s, else keeps a single 4.
     *
     * @param {DigitCell} cell4
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn4 = (cell4, currentNo) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)

        if (cell2?.count > 1n) {
            permutationsSaved = getPermutations(4n, cell4.count, base)
            cell4.digit++
        } else if (cell4.count > 1n) {
            permutationsSaved = getPermutations(4n, cell4.count - 1n, base)
            splitAfterCell(cell4, 1n, currentNo)
        }
        return permutationsSaved
    }
    /**
     * First cell is 6: skips or caps its run by the factors of 2 in the rest.
     *
     * @param {DigitCell} cell6
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn6 = (cell6, currentNo) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents > 2) {
            permutationsSaved = getPermutations(6n, cell6.count, base)
            cell6.digit++
        } else if (twoComponents && cell6.count > 2n) {
            permutationsSaved += getPermutations(6n, cell6.count - 2n, base)
            splitAfterCell(cell6, 2n, currentNo)
        } else if (cell6.count > 3n) {
            permutationsSaved += getPermutations(6n, cell6.count - 3n, base)
            splitAfterCell(cell6, 3n, currentNo)
        }
        return permutationsSaved
    }
    /**
     * First cell is 8: skips it when the rest has a factor 2, else keeps a single 8.
     *
     * @param {DigitCell} cell8
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn8 = (cell8, currentNo) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents !== 0) {
            permutationsSaved = getPermutations(8n, cell8.count, base)
            cell8.digit++
        } else if (cell8.count > 1n) {
            permutationsSaved = getPermutations(8n, cell8.count - 1n, base)
            splitAfterCell(cell8, 1n, currentNo)
        }
        return permutationsSaved
    }
    /**
     * First cell is 10: skips or caps its run by the factors of 2 in the rest and the 6s.
     *
     * @param {DigitCell} cellA
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn10 = (cellA, currentNo) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents > 2) {
            permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
            cellA.digit++
        } else {
            const cell6 = currentNo.getCellOf(6n)
            if (twoComponents > 1 && cell6) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
                cellA.digit++
            } else if (twoComponents > 0 && cell6?.count > 1n) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
                cellA.digit++
            } else if (cell6?.count > 3n) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
                cellA.digit++
            } else if (cellA.count > 3n) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count - 3n, base)
                splitAfterCell(cellA, 3n, currentNo)
            }
        }

        return permutationsSaved
    }
    /**
     * First cell is 12: skips or caps its run by the factors of 2 in the rest, the 6s and the 10s.
     *
     * @param {DigitCell} cellC
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn12 = (cellC, currentNo) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents > 1) {
            permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
            cellC.digit++
        } else {
            const cell6 = currentNo.getCellOf(6n)
            if (twoComponents === 1 && cell6) {
                permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
                cellC.digit++
            } else if (cell6?.count > 1n) {
                permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
                cellC.digit++
            } else {
                const cellA = currentNo.getCellOf(10n)
                if (twoComponents && cellA) {
                    permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
                    cellC.digit++
                } else if (cellA?.count > 3n) {
                    permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
                    cellC.digit++
                } else if (cellC.count > 1n) {
                    permutationsSaved = getPermutations(cellC.digit, cellC.count - 1n, base)
                    splitAfterCell(cellC, 1n, currentNo)
                }
            }
        }
        return permutationsSaved
    }

    /**
     * First cell is 14: skips or caps its run by the factors of 2 in the rest, the 6s, 10s and 12s.
     *
     * @param {DigitCell} cellE
     * @param {HugeIntEx} currentNo
     * @returns {bigint} canonical numbers skipped
     */
    const fn14 = (cellE, currentNo) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents > 2) {
            permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
            cellE.digit++
        } else {
            const cell6 = currentNo.getCellOf(6n)
            if (twoComponents === 2 && cell6) {
                permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                cellE.digit++
            } else if (twoComponents === 1 && cell6?.count > 1n) {
                permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                cellE.digit++
            } else if (cell6?.count > 2n) {
                permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                cellE.digit++
            } else {
                const cellA = currentNo.getCellOf(10n)
                if (twoComponents > 1 && cellA) {
                    permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                    cellE.digit++
                } else if (cellA?.count > 2n) {
                    permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                    cellE.digit++
                } else {
                    const cellC = currentNo.getCellOf(12n)
                    if (twoComponents && cellC) {
                        permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                        cellE.digit++
                    } else if (cellE.count > 3n) {
                        permutationsSaved = getPermutations(cellE.digit, cellE.count - 2n, base)
                        splitAfterCell(cellE, 2n, currentNo)
                    }
                }
            }
        }
        return permutationsSaved
    }

    return currentNo => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 15n: return 0n
            case 14n: return fn14(checkCell, currentNo)
            case 13n: return 0n
            case 12n: return fn12(checkCell, currentNo)
            case 11n: return 0n
            case 10n: return fn10(checkCell, currentNo)
            case 9n: return 0n
            case 8n: return fn8(checkCell, currentNo)
            case 7n: return 0n
            case 6n: return fn6(checkCell, currentNo)
            case 5n: return 0n
            case 4n: return fn4(checkCell, currentNo)
            case 3n: return 0n
            case 2n: return fn2(checkCell, currentNo)
            default: return 0n
        }
    }
})()
