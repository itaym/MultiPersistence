import { getPermutations } from './utils.js'

/**
 * Base‑10 accommodation module.
 *
 * This module implements base‑specific pruning and digit‑adjustment rules
 * used during multiplicative persistence search when operating in base 10.
 *
 * Behavior overview:
 *  - Examines the most significant digit (first cell) of the HugeInt.
 *  - Applies specialized rules for digits 5, 6, and 8.
 *  - When a rule matches, the digit is incremented and a permutation count
 *    is computed using `getPermutations`.
 *  - The returned permutation count is added to the global iteration counter
 *    by the search loop.
 *
 * Purpose:
 *  - Reduce the search space by skipping numbers that are known to be
 *    unproductive for persistence exploration.
 *  - Mutate the HugeInt in a controlled way to avoid exploring branches
 *    that cannot yield persistence > 2.
 *  - Provide base‑10‑specific heuristics that improve performance without
 *    requiring full persistence computation.
 *
 * Structural notes:
 *  - The returned function mutates the HugeInt in‑place by incrementing
 *    the digit of the first cell.
 *  - Only the first cell is modified; deeper cells remain unchanged.
 *  - The mutation is intentional and part of the pruning strategy.
 *
 * Digit‑specific rules:
 *
 *  - Digit 5:
 *      If the HugeInt contains any even digits, increment the 5 → 6
 *      and compute permutations for digit 5 with its count.
 *
 *  - Digit 6 or 8:
 *      If the HugeInt contains a digit 5 anywhere, increment the digit
 *      (6 → 7 or 8 → 9) and compute permutations for the current digit.
 *
 *  - Other digits:
 *      No accommodation is applied; returns 0n.
 *
 * Performance notes:
 *  - All checks are O(1) or O(number of cells), depending on HugeInt helpers.
 *  - Designed to be extremely cheap compared to persistence calculation.
 *  - Called on every iteration of the search loop when base 10 is active.
 *
 * @function base00010
 * @param {HugeInt} currentNo
 *     The HugeInt instance whose first digit is examined and possibly mutated.
 *
 * @returns {BigInt}
 *     Number of permutations skipped due to accommodation rules,
 *     or `0n` if no rule applies.
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