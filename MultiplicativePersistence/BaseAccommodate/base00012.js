import { getPermutations, splitAfterCell } from "./utils.js";

/**
 * Base‑12 accommodation module.
 *
 * This module implements pruning and digit‑adjustment heuristics used during
 * multiplicative persistence search when operating in base 12. The heuristics
 * examine the most significant digit (first cell) of the HugeInt and apply
 * specialized rules for digits 3, 4, 6, 8, 9, and 10 (A₁₂).
 *
 * When a rule matches:
 *  - The digit of the first cell is incremented (e.g., 3 → 4, 6 → 7, 9 → A).
 *  - A permutation count is computed using `getPermutations`.
 *  - In some cases, the HugeInt structure is modified (e.g., splitting a cell).
 *  - The permutation count is returned to the search loop, which uses it to
 *    skip entire branches of the search space.
 *
 * Purpose:
 *  - Reduce the search space by skipping numbers that cannot produce
 *    persistence > 2 in base 12.
 *  - Mutate the HugeInt in a controlled way to avoid exploring unproductive
 *    digit configurations.
 *  - Provide base‑specific heuristics that dramatically improve performance.
 *
 * Structural notes:
 *  - The returned function mutates the HugeInt in‑place.
 *  - Only the first cell is directly modified, except in cases where
 *    `splitAfterCell` is invoked (digit 6 rule).
 *  - All mutations preserve sorted‑digit canonical form.
 *
 * Digit‑specific rules:
 *
 *  - Digit 3:
 *      If the HugeInt has more than one “two‑component” pair
 *      (`countTwoComponentsNoFirstCell > 1`), increment 3 → 4 and skip
 *      permutations for digit 3.
 *
 *  - Digit 4:
 *      If the HugeInt contains a digit 3 anywhere, increment 4 → 5 and skip
 *      permutations for digit 4.
 *
 *  - Digit 6:
 *      If the HugeInt has any two‑component pairs, increment 6 → 7 and skip
 *      permutations for digit 6.
 *      Otherwise, if digit 6 appears with count > 1, split the cell using
 *      `splitAfterCell` and skip permutations for count‑1.
 *
 *  - Digit 8:
 *      If the HugeInt contains digit 3 or digit 6, increment 8 → 9 and skip
 *      permutations for digit 8.
 *
 *  - Digit 9:
 *      If the HugeInt has more than one two‑component pair, increment 9 → A
 *      and skip permutations.
 *      Otherwise, if digit 6 appears with count > 1, increment 9 → A and skip.
 *
 *  - Digit 10 (A₁₂):
 *      If the HugeInt has any two‑component pairs AND contains digit 9 or 3,
 *      increment A → B and skip permutations.
 *      Otherwise, if digit 6 exists anywhere, increment A → B and skip.
 *
 *  - Digits 5, 7, 11:
 *      No accommodation rules apply; return 0n.
 *
 * Performance notes:
 *  - All checks are O(1) or proportional to the number of HugeInt cells.
 *  - Designed to be extremely cheap compared to persistence calculation.
 *  - Called on every iteration of the search loop when base 12 is active.
 *
 * @function base00012
 * @param {HugeInt} currentNo
 *     The HugeInt instance whose first digit is examined and possibly mutated.
 *
 * @returns {BigInt}
 *     Number of permutations skipped due to accommodation rules,
 *     or `0n` if no rule applies.
 */
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

        if (currentNo.hasEvenDigits()) {
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