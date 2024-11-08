import { getPermutations, splitAfterCell } from "./utils.js";

export const base00009 = (() => {
    let permutationsSaved

    const fn3 = (currentNo, cell3) => {
        if (cell3.count > 1n) {
            permutationsSaved = getPermutations(3n, cell3.count - 1n, 9n)
            splitAfterCell(currentNo, cell3, 1n)
            return permutationsSaved
        }
        return 0n
    }
    const fn6 = (currentNo, cell6) => {
        const cell3 = currentNo.getCellOf(3n)

        if (cell3) {
            permutationsSaved = getPermutations(6n, cell6.count, 9n)
            cell6.digit++
            return permutationsSaved
        }

        if (cell6.count > 1n) {
            permutationsSaved = getPermutations(6n, cell6.count - 1n, 9n)
            splitAfterCell(currentNo, cell6, 1n)
            return permutationsSaved
        }
        return 0n
    }
    return (currentNo) => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 6n:
                return fn6(currentNo, checkCell)
            case 3n:
                return fn3(currentNo, checkCell)
            default:
                return 0n
        }
    }
})()