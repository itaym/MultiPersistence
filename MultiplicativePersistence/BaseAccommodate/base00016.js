import { getPermutations, splitAfterCell } from "./utils.js";

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