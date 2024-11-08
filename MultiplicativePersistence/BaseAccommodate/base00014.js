import { getPermutations } from "./utils.js";

export const base00014 = (() => {
    let permutationsSaved

    const fn7 = (currentNo, cell7) => {
        if (currentNo.hasEvenDigits()) {
            permutationsSaved = getPermutations(7n, cell7.count, 14n)
            cell7.digit++
            return permutationsSaved
        }
        return 0n
    }
    const fnEven = (currentNo, checkCell) => {
        if (currentNo.isCellOf(7n)) {
            permutationsSaved = getPermutations(checkCell.digit, checkCell.count, 14n)
            checkCell.digit++
            return permutationsSaved
        }
        return 0n
    }
    return (currentNo) => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 12n: return fnEven(currentNo, checkCell)
            case 10n: return fnEven(currentNo, checkCell)
            case 8n: return fnEven(currentNo, checkCell)
            case 7n: return fn7(currentNo, checkCell)
            default: return 0n
        }
    }
})()