import { getPermutations } from "./utils.js";

export const base00015 = (() => {
    const base = 15n

    const fn5 = (currentNo, cell5) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(3n)) {
            permutationsSaved = getPermutations(5n, cell5.count, base)
            cell5.digit++
            cell5.change = true
        }
        return permutationsSaved
    }
    const fn6 = (currentNo, cell6) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(6n, cell6.count, base)
            cell6.digit++
            cell6.change = true
        }
        return permutationsSaved
    }
    const fn9 = (currentNo, cell9) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(9n, cell9.count, base)
            cell9.digit++
            cell9.change = true
        }
        return permutationsSaved
    }
    const fn12 = (currentNo, cell12) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(12n, cell12.count, base)
            cell12.digit++
            cell12.change = true
        }
        return permutationsSaved
    }
    return (currentNo) => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 14n: return 0n
            case 13n: return 0n
            case 12n: return fn12(currentNo, checkCell)
            case 11n: return 0n
            case 10n: return 0n
            case 9n: return fn9(currentNo, checkCell)
            case 8n: return 0n
            case 7n: return 0n
            case 6n: return fn6(currentNo, checkCell)
            case 5n: return fn5(currentNo, checkCell)
            default: return 0n
        }
    }

})()