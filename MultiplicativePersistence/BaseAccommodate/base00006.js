import { emptyFunction, getPermutations } from "./baseAccommodate.js";

export const base00006 = (() => {

    const fn3 = (currentNo, cell3) => {
        const cell2 = currentNo.getCellOf(2n)
        let permutationsSaved = 0n

        if (cell2) {
            permutationsSaved = getPermutations(3n, cell3.count, 6n)
            cell3.digit++
        }
        return permutationsSaved
    }

    const fn4 = (currentNo, cell4) => {
        const cell3 = currentNo.getCellOf(3n)
        let permutationsSaved = 0n

        if (cell3) {
            permutationsSaved = getPermutations(4n, cell4.count, 6n)
            cell4.digit++
        }
        return permutationsSaved
    }

    const checkingFns = {
        1n: emptyFunction,
        2n: emptyFunction,
        3n: fn3,
        4n: fn4,
        5n: emptyFunction,
    }
    return (currentNo) => {
        const checkCell = currentNo.firstCell
        return checkingFns[checkCell.digit](currentNo, checkCell)
    }
})()