import { getPermutations, splitAfterCell } from "./utils.js";

/**
 * Base‑16 accommodation module.
 *
 * This module implements advanced pruning and digit‑adjustment heuristics
 * used during multiplicative persistence search when operating in base 16.
 * The heuristics examine the most significant digit (first cell) of the HugeInt
 * and apply specialized rules for digits 2, 4, 6, 8, 10 (A₁₆), 12 (C₁₆), and 14 (E₁₆).
 *
 * When a rule matches:
 *  - The digit of the first cell is incremented (e.g., 6 → 7, 10 → 11).
 *  - A permutation count is computed using `getPermutations`.
 *  - In some cases, the HugeInt structure is modified using `splitAfterCell`.
 *  - The permutation count is returned to the search loop, which uses it to
 *    skip entire branches of the search space.
 *
 * Purpose:
 *  - Reduce the search space by skipping numbers that cannot produce
 *    persistence > 2 in base 16.
 *  - Mutate the HugeInt in a controlled way to avoid exploring unproductive
 *    digit configurations.
 *  - Provide base‑specific heuristics that dramatically improve performance.
 *
 * Structural notes:
 *  - The returned function mutates the HugeInt in‑place.
 *  - Only the first cell is directly modified, except in cases where
 *    `splitAfterCell` is invoked (digits 2, 4, 6, 8, 10, 12, 14).
 *  - All mutations preserve sorted‑digit canonical form.
 *
 * Digit‑specific rules:
 *
 *  - Digit 2:
 *      If count > 3, split off 3 units and skip permutations for count‑3.
 *
 *  - Digit 4:
 *      If digit 2 exists with count > 1, increment 4 → 5 and skip permutations.
 *      Otherwise, if count > 1, split off 1 unit and skip permutations for count‑1.
 *
 *  - Digit 6:
 *      If `cTCNFC() > 2`, increment 6 → 7 and skip permutations.
 *      Else if `cTCNFC() > 0` and count > 2, split off 2 units.
 *      Else if count > 3, split off 3 units.
 *
 *  - Digit 8:
 *      If any two‑component pairs exist, increment 8 → 9 and skip permutations.
 *      Otherwise, if count > 1, split off 1 unit.
 *
 *  - Digit 10 (A₁₆):
 *      If `cTCNFC() > 2`, increment A → B.
 *      Else if `cTCNFC() > 1` and digit 6 exists, increment A → B.
 *      Else if `cTCNFC() > 0` and digit 6 has count > 1, increment A → B.
 *      Else if digit 6 has count > 3, increment A → B.
 *      Else if count > 3, split off 3 units.
 *
 *  - Digit 12 (C₁₆):
 *      If `cTCNFC() > 1`, increment C → D.
 *      Else if `cTCNFC() === 1` and digit 6 exists, increment C → D.
 *      Else if digit 6 has count > 1, increment C → D.
 *      Else if `cTCNFC() > 0` and digit 10 exists, increment C → D.
 *      Else if digit 10 has count > 3, increment C → D.
 *      Else if count > 1, split off 1 unit.
 *
 *  - Digit 14 (E₁₆):
 *      If `cTCNFC() > 2`, increment E → F.
 *      Else if `cTCNFC() === 2` and digit 6 exists, increment E → F.
 *      Else if `cTCNFC() === 1` and digit 6 has count > 1, increment E → F.
 *      Else if digit 6 has count > 2, increment E → F.
 *      Else if `cTCNFC() > 1` and digit 10 exists, increment E → F.
 *      Else if digit 10 has count > 2, increment E → F.
 *      Else if `cTCNFC() > 0` and digit 12 exists, increment E → F.
 *      Else if count > 3, split off 2 units.
 *
 *  - Digits 3, 5, 7, 9, 11, 13, 15:
 *      No accommodation rules apply; return 0n.
 *
 * Performance notes:
 *  - All checks are O(1) or proportional to the number of HugeInt cells.
 *  - Designed to be extremely cheap compared to persistence calculation.
 *  - Called on every iteration of the search loop when base 16 is active.
 *
 * @function base00016
 * @param {HugeInt} currentNo
 *     The HugeInt instance whose first digit is examined and possibly mutated.
 *
 * @returns {BigInt}
 *     Number of permutations skipped due to accommodation rules,
 *     or `0n` if no rule applies.
 */
export const base00016 = (() => {
    const base = 16n

    const fn2 = (currentNo, cell2) => {
        let permutationsSaved = 0n

        if (cell2.count > 3n) {
            permutationsSaved = getPermutations(2n, cell2.count - 3n, base)
            splitAfterCell(currentNo, cell2, 3n)
        }
        return permutationsSaved
    }
    const fn4 = (currentNo, cell4) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)

        if (cell2?.count > 1n) {
            permutationsSaved = getPermutations(4n, cell4.count, base)
            cell4.digit++
        }
        else if (cell4.count > 1n) {
            permutationsSaved = getPermutations(4n, cell4.count - 1n, base)
            splitAfterCell(currentNo, cell4, 1n)
        }
        return permutationsSaved
    }
    const fn6 = (currentNo, cell6) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents > 2) {
            permutationsSaved = getPermutations(6n, cell6.count, base)
            cell6.digit++
        }
        else if (twoComponents && cell6.count > 2n) {
            permutationsSaved += getPermutations(6n, cell6.count - 2n, base)
            splitAfterCell(currentNo, cell6, 2n)
        }
        else if (cell6.count > 3n) {
            permutationsSaved += getPermutations(6n, cell6.count - 3n, base)
            splitAfterCell(currentNo, cell6, 3n)
        }
        return permutationsSaved
    }
    const fn8 = (currentNo, cell8) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents !== 0) {
            permutationsSaved = getPermutations(8n, cell8.count, base)
            cell8.digit++
        }
        else if (cell8.count > 1n) {
            permutationsSaved = getPermutations(8n, cell8.count - 1n, base)
            splitAfterCell(currentNo, cell8, 1n)
        }
        return permutationsSaved
    }
    const fn10 = (currentNo, cellA) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents > 2) {
            permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
            cellA.digit++
        }
        else {
            const cell6 = currentNo.getCellOf(6n)
            if (twoComponents > 1 && cell6) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
                cellA.digit++
            }
            else if (twoComponents > 0 && cell6?.count > 1n) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
                cellA.digit++
            }
            else if (cell6?.count > 3n) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
                cellA.digit++
            }
            else if (cellA.count > 3n) {
                permutationsSaved = getPermutations(cellA.digit, cellA.count - 3n, base)
                splitAfterCell(currentNo, cellA, 3n)
            }
        }

        return permutationsSaved
    }
    const fn12 = (currentNo, cellC) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents > 1) {
            permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
            cellC.digit++
        }
        else {
            const cell6 = currentNo.getCellOf(6n)
            if (twoComponents === 1 && cell6) {
                permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
                cellC.digit++
            }
            else if (cell6?.count > 1n) {
                permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
                cellC.digit++
            }
            else {
                const cellA = currentNo.getCellOf(10n)
                if (twoComponents && cellA) {
                    permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
                    cellC.digit++
                }
                else if (cellA?.count > 3n) {
                    permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
                    cellC.digit++
                }
                else if (cellC.count > 1n) {
                    permutationsSaved = getPermutations(cellC.digit, cellC.count - 1n, base)
                    splitAfterCell(currentNo, cellC, 1n)
                }
            }
        }
        return permutationsSaved
    }

    const fn14 = (currentNo, cellE) => {
        let permutationsSaved = 0n

        const twoComponents = currentNo.cTCNFC()

        if (twoComponents > 2) {
            permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
            cellE.digit++
        }
        else {
            const cell6 = currentNo.getCellOf(6n)
            if (twoComponents === 2 && cell6) {
                permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                cellE.digit++
            }
            else if (twoComponents === 1 && cell6?.count > 1n) {
                permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                cellE.digit++
            }
            else if (cell6?.count > 2n) {
                permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                cellE.digit++
            }
            else {
                const cellA = currentNo.getCellOf(10n)
                if (twoComponents > 1 && cellA) {
                    permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                    cellE.digit++
                }
                else if (cellA?.count > 2n) {
                    permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                    cellE.digit++
                }
                else {
                    const cellC = currentNo.getCellOf(12n)
                    if (twoComponents && cellC) {
                        permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
                        cellE.digit++
                    }
                    else if (cellE.count > 3n) {
                        permutationsSaved = getPermutations(cellE.digit, cellE.count - 2n, base)
                        splitAfterCell(currentNo, cellE, 2n)
                    }
                }
            }
        }
        return permutationsSaved
    }

    return (currentNo) => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 15n: return 0n
            case 14n: return fn14(currentNo, checkCell)
            case 13n: return 0n
            case 12n: return fn12(currentNo, checkCell)
            case 11n: return 0n
            case 10n: return fn10(currentNo, checkCell)
            case 9n: return 0n
            case 8n: return fn8(currentNo, checkCell)
            case 7n: return 0n
            case 6n: return fn6(currentNo, checkCell)
            case 5n: return 0n
            case 4n: return fn4(currentNo, checkCell)
            case 3n: return 0n
            case 2n: return fn2(currentNo, checkCell)
            default: return 0n
        }
    }
})()