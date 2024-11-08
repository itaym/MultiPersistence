import { getPermutations, splitAfterCell } from "./baseAccommodate.js";

export const base00008 = (() => {
    const fn2 = (currentNo, cell2) => {
        let permutationsSaved = 0n

        if (cell2.count > 2n) {
            permutationsSaved = getPermutations(2n, cell2.count - 2n, 8n)
            splitAfterCell(currentNo, cell2, 2n)
        }
        return permutationsSaved
    }
    const fn4 = (currentNo, cell4) => {
        const cell2 = currentNo.getCellOf(2n)
        let permutationsSaved = 0n

        if (cell2) {
            permutationsSaved = getPermutations(4n, cell4.count, 8n)
            cell4.digit++
        }
        else if (cell4.count > 1n) {
            permutationsSaved = getPermutations(4n, cell4.count - 1n, 8n)
            splitAfterCell(currentNo, cell4, 1n)
        }
        return permutationsSaved
    }
    const fn6 = (currentNo, cell6) => {
        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        let permutationsSaved = 0n

        if (cell4 || cell2?.count > 1n) {
            permutationsSaved = getPermutations(6n, cell6.count, 8n)
            cell6.digit++
        }
        else if (cell6.count > 2n) {
            permutationsSaved = getPermutations(6n, cell6.count - 2n, 8n)
            splitAfterCell(currentNo, cell6, 2n)

        }
        return permutationsSaved
    }

    const checkingFns = {
        2n: fn2,
        4n: fn4,
        6n: fn6,
    }
    return (currentNo) => {
        const checkCell = currentNo.firstCell

        let permutationsSaved = 0n

        if (!(checkCell.digit % 2n)) {
            permutationsSaved = checkingFns[checkCell.digit](currentNo, checkCell)
        }
        return permutationsSaved
    }
})()