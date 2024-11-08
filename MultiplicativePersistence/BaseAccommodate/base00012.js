import {getPermutations, splitAfterCell} from "./baseAccommodate.js";

export const base00012 = (() => {
    const base = 12n

    const fn3 = (currentNo, cell3) => {
        let permutationsSaved = 0n

        const countTwoComponents = currentNo.cTCNFC()

        if (countTwoComponents > 1) {
            permutationsSaved = getPermutations(cell3.digit, cell3.count, base)
            cell3.digit++
        }
        return permutationsSaved
    }
    const fn4 = (currentNo, cell4) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(3n)) {
            permutationsSaved = getPermutations(4n, cell4.count, base)
            cell4.digit++
        }
        return permutationsSaved
    }
    const fn6 = (currentNo, cell6) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents) {
            permutationsSaved = getPermutations(cell6.digit, cell6.count, base)
            cell6.digit++
            return permutationsSaved
        }
        if (cell6.count > 1n) {
            permutationsSaved = getPermutations(cell6.digit, cell6.count - 1n, base)
            splitAfterCell(currentNo, cell6, 1n)
        }
        return permutationsSaved
    }
    const fn8 = (currentNo, cell8) => {
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
    const fn9 = (currentNo, cell9) => {
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
    const fn10 = (currentNo, cellA) => {
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

    /**
     * @param currentNo {HugeInt}
     */
    return (currentNo) => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 11n: return 0n
            case 10n: return fn10(currentNo, checkCell)
            case 9n: return fn9(currentNo, checkCell)
            case 8n: return fn8(currentNo, checkCell)
            case 7n: return 0n
            case 6n: return fn6(currentNo, checkCell)
            case 5n: return 0n
            case 4n: return fn4(currentNo, checkCell)
            case 3n: return fn3(currentNo, checkCell)
            default: return 0n
        }
    }
})()