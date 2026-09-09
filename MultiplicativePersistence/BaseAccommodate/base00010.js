import { getPermutations } from './utils.js'

/**
 * Base-10 accommodate rules. Looks at the first cell and, for digit 5 (with any even digit
 * present) or digit 6/8 (with a 5 present), bumps the digit and skips the permutations.
 *
 * @function base00010
 * @param {HugeInt} currentNo examined and possibly mutated in place
 * @returns {BigInt} permutations skipped, or `0n`
 */
export const base00010 = (() => {
    let permutationsSaved

    const fn5 = (currentNo, cell5) => {
        if (currentNo.hasEvenDigits()) {
            permutationsSaved = getPermutations(5n, cell5.count, 10n)
            cell5.digit++
            return permutationsSaved
        }
        return 0n
    }
    const fnEven = (currentNo, checkCell) => {
        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(checkCell.digit, checkCell.count, 10n)
            checkCell.digit++
            return permutationsSaved
        }
        return 0n
    }
    return (currentNo) => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 8n: return fnEven(currentNo, checkCell)
            case 6n: return fnEven(currentNo, checkCell)
            case 5n: return fn5(currentNo, checkCell)
            default: return 0n
        }
    }
})()