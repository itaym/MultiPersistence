import {emptyFunction, getPermutations, splitAfterCell} from "./utils.js";

export { default } from './BaseAccommodate.js';


const base00020 = (() => {
    const base = 20n

    const fn5 = (currentNo, cell5) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const componentsOfTwo = currentNo.countTwoComponents()

        if (componentsOfTwo > 1n) {
            permutationsSaved = getPermutations(5n, cell5.count, base)
            cell5.digit++
        }
        return permutationsSaved
    }
    const fn6 = (currentNo, cell6) => {
        let permutationsSaved = 0n
        if (currentNo.isCellOf(5n)) {
            if (currentNo.isCellOf(2n) || currentNo.isCellOf(4n)) {
                permutationsSaved = getPermutations(6n, cell6.count, base)
                cell6.digit++
                // cell6.change = true
                return permutationsSaved
            }
            if (cell6.count > 1n) {
                permutationsSaved = getPermutations(6n, cell6.count - 1n, base)
                splitAfterCell(currentNo, cell6, 1n)
            }

        }
        return permutationsSaved
    }
    const fn8 = (currentNo, cell8) => {
        let permutationsSaved = 0n
        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(8n, cell8.count, base)
            cell8.digit++
            //cell8.change = true
        }
        return permutationsSaved
    }
    const fn10 = (currentNo, cell10) => {
        let permutationsSaved = 0n

        if (currentNo.hasEvenDigits()) {
            permutationsSaved = getPermutations(10n, cell10.count, base)
            cell10.digit++
            //cell10.change = true
        }
        return permutationsSaved
    }
    const fn12 = (currentNo, cell12) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(10n)) {
            permutationsSaved = getPermutations(12n, cell12.count, base)
            cell12.digit++
            //cell12.change = true
            return permutationsSaved
        }
        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(12n, cell12.count, base)
            cell12.digit++
            //cell12.change = true
        }
        return permutationsSaved
    }
    const fn14 = (currentNo, cell14) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(10n)) {
            permutationsSaved = getPermutations(14n, cell14.count, base)
            cell14.digit++
            //cell14.change = true
            return permutationsSaved
        }
        if (cell14.count > 1n && currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(14n, cell14.count, base)
            cell14.digit++
            //cell14.change = true
        }
        return permutationsSaved
    }
    const fn16 = (currentNo, cell16) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(5n)) {
            permutationsSaved = getPermutations(16n, cell16.count, base)
            cell16.digit++
            //cell16.change = true
        }
        return permutationsSaved
    }
    const fn18 = (currentNo, cell18) => {
        let permutationsSaved = 0n

        if (currentNo.isCellOf(5n)) {
            if (cell18.count > 1n) {
                permutationsSaved = getPermutations(18n, cell18.count - 1n, base)
                splitAfterCell(currentNo, cell18, 1n)
                return permutationsSaved
            }

        }
        return permutationsSaved
    }
    return (currentNo) => {
        const checkCell = currentNo.firstCell
        switch (checkCell.digit) {
            case 18n: return fn18(currentNo, checkCell)
            case 17n: return 0n
            case 16n: return fn16(currentNo, checkCell)
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
            case 5n: return fn5(currentNo, checkCell)
            default: return 0n
        }
    }

})()
const base00024 = (() => {
    const base = 24n

    const fn3 = (currentNo, cell3) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)

        if (cell2?.count > 2n) {
            permutationsSaved = getPermutations(cell3.digit, cell3.count, base)
            cell3.digit++
        }
        return permutationsSaved
    }
    const fn4 = (currentNo, cell4) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell3 = currentNo.getCellOf(3n)

        if (cell2 && cell3) {
            permutationsSaved = getPermutations(4n, cell4.count, base)
            cell4.digit++
        }
        return permutationsSaved
    }
    const fn6 = (currentNo, cell6) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)

        if (cell2?.count > 1n || cell4) {
            permutationsSaved = getPermutations(cell6.digit, cell6.count, base)
            cell6.digit++
        }
        else if (cell6.count > 1n) {
            permutationsSaved = getPermutations(cell6.digit, cell6.count - 1n, base)
            splitAfterCell(currentNo, cell6, 1n)
        }
        return permutationsSaved
    }
    const fn8 = (currentNo, cell8) => {
        let permutationsSaved = 0n

        const cell3 = currentNo.getCellOf(3n)
        const cell6 = currentNo.getCellOf(6n)

        if (cell3 || cell6) {
            permutationsSaved = getPermutations(cell8.digit, cell8.count, base)
            cell8.digit++
        }
        return permutationsSaved
    }
    const fn9 = (currentNo, cell9) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)

        if (cell2?.count > 2n || cell4?.count > 1n || cell6?.count > 2n || cell8) {
            permutationsSaved = getPermutations(cell9.digit, cell9.count, base)
            cell9.digit++
        }
        return permutationsSaved
    }
    const fn10 = (currentNo, cellA) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell3 = currentNo.getCellOf(3n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cell9 = currentNo.getCellOf(9n)

        if (((cell3 || cell9) && (cell2 || cell4 || cell8)) || cell6) {
            permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
            cellA.digit++
        }
        return permutationsSaved
    }


    const checkingFns = {
        1n: emptyFunction,
        2n: emptyFunction,
        3n: fn3,
        4n: fn4,
        5n: emptyFunction,
        6n: fn6,
        7n: emptyFunction,
        8n: fn8,
        9n: fn9,
        10n: fn10,
        11n: emptyFunction,
    }
    /**
     * @param currentNo {HugeInt}
     */
    return (currentNo) => {

        const checkCell = currentNo.firstCell

        return checkingFns[checkCell.digit](currentNo, checkCell)
    }
})()
const base00032 = (() => {
    const base = 32n
    const fn2 = (currentNo, cell2) => {
        let permutationsSaved = 0n

        if (cell2.count > 4n) {
            permutationsSaved = getPermutations(cell2.digit, cell2.count - 4n, base)
            splitAfterCell(currentNo, cell2, 4n)
        }
        return permutationsSaved
    }
    const fn4 = (currentNo, cell4) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)

        if (cell2?.count > 3n) {
            permutationsSaved = getPermutations(cell4.digit, cell4.count, base)
            cell4.digit++
        }
        else if (cell4.count > 2n) {
            permutationsSaved = getPermutations(cell4.digit, cell4.count - 2n, base)
            splitAfterCell(currentNo, cell4, 2n)

        }
        return permutationsSaved
    }
    const fn6 = (currentNo, cell6) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)

        if (cell4?.count > 1n || cell2?.count > 3n || (cell4 && cell2?.count > 1n)) {
            permutationsSaved = getPermutations(cell6.digit, cell6.count, base)
            cell6.digit++
        }
        else if (cell6.count > 4n) {
            permutationsSaved = getPermutations(cell6.digit, cell6.count - 4n, base)
            splitAfterCell(currentNo, cell6, 4n)
        }
        return permutationsSaved
    }
    const fn8 = (currentNo, cell8) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)

        if ((cell6 && (cell4 || cell2)) || (cell4 && cell2?.count > 1n)) {
            permutationsSaved = getPermutations(cell8.digit, cell8.count, base)
            cell8.digit++
        }
        else if (cell8.count > 1n) {
            permutationsSaved = getPermutations(cell8.digit, cell8.count - 1n, base)
            splitAfterCell(currentNo, cell8, 1n)
        }
        return permutationsSaved
    }
    const fn10 = (currentNo, cellA) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)

        if (cell8?.count > 1n || cell6?.count > 3n || cell4?.count > 1n || cell2?.count > 3n ||
            (cell8 && (cell6 || cell4 || cell2)) ||
            (cell6 && (cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell4 && (cell2?.count > 1n))
        ) {
            permutationsSaved = getPermutations(cellA.digit, cellA.count, base)
            cellA.digit++
        }
        else if (cellA.count > 4n) {
            permutationsSaved = getPermutations(cellA.digit, cellA.count - 4n, base)
            splitAfterCell(currentNo, cellA, 4n)
        }
        return permutationsSaved
    }
    const fn12 = (currentNo, cellC) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)

        if (cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n ||
            (cellA && (cell8 || cell4 || cell2?.count > 1n)) ||
            (cell6 && (cell4 || cell2?.count > 1n)) ||
            (cell4 && cell2)
        ) {
            permutationsSaved = getPermutations(cellC.digit, cellC.count, base)
            cellC.digit++
        }
        else if (cellC.count > 1n) {
            permutationsSaved = getPermutations(cellC.digit, cellC.count - 1n, base)
            splitAfterCell(currentNo, cellC, 1n)
        }
        return permutationsSaved
    }
    const fn14 = (currentNo, cellE) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)

        if (cellC?.count > 1n || cellA?.count > 3n || cell8?.count > 1n || cell6?.count > 3n || cell4?.count > 1n || cell2?.count > 3n ||
            (cellC && (cellA?.count > 1n  || cell8 || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellA && (cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell8 && (cell6 || cell4 || cell2)) ||
            (cell6 && (cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell4 && (cell2?.count > 1n))
        ) {
            permutationsSaved = getPermutations(cellE.digit, cellE.count, base)
            cellE.digit++
        }
        else if (cellE.count > 2n) {
            permutationsSaved = getPermutations(cellE.digit, cellE.count - 2n, base)
            splitAfterCell(currentNo, cellE, 2n)
        }
        return permutationsSaved
    }
    const fn16 = (currentNo, cellG) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)
        const cellE = currentNo.getCellOf(14n)

        if (cellE || cellC || cellA || cell8 || cell6 || cell4 || cell2) {
            permutationsSaved = getPermutations(cellG.digit, cellG.count, base)
            cellG.digit++
        }
        else if (cellG.count > 1n) {
            permutationsSaved = getPermutations(cellG.digit, cellG.count - 1n, base)
            splitAfterCell(currentNo, cellG, 1n)
        }
        return permutationsSaved
    }
    const fn18 = (currentNo, cellI) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)
        const cellE = currentNo.getCellOf(14n)
        const cellG = currentNo.getCellOf(16n)

        if (cellG || cellE?.count > 3n || cellC?.count > 1n || cellA?.count > 3n || cell8?.count > 1n || cell6?.count > 3n || cell4?.count > 1n || cell2?.count > 3n ||
            (cellE && (cellA?.count > 2n  || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellC && (cellA?.count > 1n  || cell8 || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellA && (cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell8 && (cell6 || cell4 || cell2)) ||
            (cell6 && (cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell4 && (cell2?.count > 1n))
        ) {
            permutationsSaved = getPermutations(cellI.digit, cellI.count, base)
            cellI.digit++
        }
        else if (cellI.count > 3n) {
            permutationsSaved = getPermutations(cellI.digit, cellI.count - 3n, base)
            splitAfterCell(currentNo, cellI, 3n)
        }
        return permutationsSaved
    }
    const fn20 = (currentNo, cellK) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)
        const cellE = currentNo.getCellOf(14n)
        const cellG = currentNo.getCellOf(16n)
        const cellI = currentNo.getCellOf(18n)

        if (cellI?.count > 2n || cellG || cellE?.count > 2n || cellC?.count > 1n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n ||
            (cellI && (cellE?.count > 1n || cellC || cellA?.count > 1n || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellE && (cellC || cellA?.count > 1n  || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellC && (cellA || cell6 || cell4 || cell2)) ||
            (cellA && (cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cell6 && (cell4 || cell2?.count > 1n)) ||
            (cell4 && cell2)
        ) {
            permutationsSaved = getPermutations(cellK.digit, cellK.count, base)
            cellK.digit++
        }
        else if (cellK.count > 2n) {
            permutationsSaved = getPermutations(cellK.digit, cellK.count - 2n, base)
            splitAfterCell(currentNo, cellK, 2n)
        }
        return permutationsSaved
    }
    const fn22 = (currentNo, cellM) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)
        const cellE = currentNo.getCellOf(14n)
        const cellG = currentNo.getCellOf(16n)
        const cellI = currentNo.getCellOf(18n)
        const cellK = currentNo.getCellOf(20n)

        if (cellK?.count > 1n || cellI?.count > 3n || cellG || cellE?.count > 3n || cellC?.count > 1n || cellA?.count > 3n || cell8?.count > 1n || cell6?.count > 3n || cell4?.count > 1n || cell2?.count > 3n ||
            (cellK && (cellE?.count > 1n || cellC || cellA?.count > 1n || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellI && (cellE?.count > 2n || cellC?.count > 1n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellE && (cellC?.count > 1n || cellA?.count > 2n  || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellC && (cellA?.count > 1n  || cell8 || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellA && (cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell8 && (cell6 || cell4 || cell2)) ||
            (cell6 && (cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell4 && (cell2?.count > 1n))
        ) {
            permutationsSaved = getPermutations(cellM.digit, cellM.count, base)
            cellM.digit++
        }
        else if (cellM.count > 3n) {
            permutationsSaved = getPermutations(cellM.digit, cellM.count - 3n, base)
            splitAfterCell(currentNo, cellM, 3n)
        }
        return permutationsSaved
    }
    const fn24 = (currentNo, cellO) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)
        const cellE = currentNo.getCellOf(14n)
        const cellG = currentNo.getCellOf(16n)
        const cellI = currentNo.getCellOf(18n)
        const cellK = currentNo.getCellOf(20n)
        const cellM = currentNo.getCellOf(22n)

        if (cellM?.count > 1n || cellK || cellI?.count > 1n || cellG || cellE?.count > 2n || cellC || cellA?.count > 1n || cell8 || cell6?.count > 1n || cell4 || cell2?.count > 1n ||
            (cellM && (cellK || cellI || cellE || cellC || cellA|| cell6 || cell4 || cell2)) ||
            (cellI && (cellE || cellC || cellA || cell8 || cell6 || cell4 || cell2)) ||
            (cellE && (cellC || cellA|| cell8 || cell6|| cell4|| cell2)) ||
            (cellA && (cell8 || cell6 || cell4 || cell2)) ||
            (cell6 && (cell4 || cell2))
        ) {
            permutationsSaved = getPermutations(cellO.digit, cellO.count, base)
            cellO.digit++
        }
        else if (cellO.count > 1n) {
            permutationsSaved = getPermutations(cellO.digit, cellO.count - 1n, base)
            splitAfterCell(currentNo, cellO, 1n)
        }
        return permutationsSaved
    }
    const fn26 = (currentNo, cellQ) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)
        const cellE = currentNo.getCellOf(14n)
        const cellG = currentNo.getCellOf(16n)
        const cellI = currentNo.getCellOf(18n)
        const cellK = currentNo.getCellOf(20n)
        const cellM = currentNo.getCellOf(22n)
        const cellO = currentNo.getCellOf(24n)

        if (cellO?.count > 1n || cellM?.count > 3n || cellK?.count > 1n || cellI?.count > 3n || cellG || cellE?.count > 3n || cellC?.count > 1n || cellA?.count > 3n || cell8?.count > 1n || cell6?.count > 3n || cell4?.count > 1n || cell2?.count > 3n ||
            (cellO && (cellM || cellK || cellI || cellE || cellC || cellA || cell8 || cell6 || cell4 || cell2)) ||
            (cellM && (cellK?.count > 1n || cellI?.count > 2n ||  cellE?.count > 2n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellK && (cellI?.count > 1n || cellE?.count > 1n || cellC || cellA?.count > 1n || cell8 || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellI && (cellE?.count > 2n || cellC?.count > 1n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellE && (cellC?.count > 1n || cellA?.count > 2n  || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellC && (cellA?.count > 1n  || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellA && (cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell8 && (cell6 || cell4 || cell2)) ||
            (cell6 && (cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell4 && (cell2?.count > 1n))
        ) {
            permutationsSaved = getPermutations(cellQ.digit, cellQ.count, base)
            cellQ.digit++

        }
        else if (cellQ.count > 3n) {
            permutationsSaved = getPermutations(cellQ.digit, cellQ.count - 3n, base)
            splitAfterCell(currentNo, cellQ, 3n)
        }
        return permutationsSaved
    }
    const fn28 = (currentNo, cellS) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)
        const cellE = currentNo.getCellOf(14n)
        const cellG = currentNo.getCellOf(16n)
        const cellI = currentNo.getCellOf(18n)
        const cellK = currentNo.getCellOf(20n)
        const cellM = currentNo.getCellOf(22n)
        const cellO = currentNo.getCellOf(24n)
        const cellQ = currentNo.getCellOf(26n)

        if (cellQ?.count > 2n || cellO || cellM?.count > 2n || cellK?.count > 1n || cellI?.count > 2n || cellG || cellE?.count > 2n || cellC?.count > 1n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n ||
            (cellQ && (cellM?.count > 1n  || cellK || cellI?.count > 1n || cellE?.count > 1n || cellC || cellA?.count > 1n || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellM && (cellK || cellI?.count > 1n ||  cellE?.count > 1n || cellA?.count > 1n || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellK && (cellI || cellE || cellC || cellA || cell6 || cell4 || cell2)) ||
            (cellI && (cellE?.count > 1n || cellC || cellA?.count > 1n || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellE && (cellC || cellA?.count > 1n || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellC && (cellA || cell6 || cell4 || cell2 )) ||
            (cellA && (cell6?.count > 1n || cell4|| cell2?.count > 1n)) ||
            (cell6 && (cell4 || cell2?.count > 1n)) ||
            (cell4 && cell2)
        ) {
            permutationsSaved = getPermutations(cellS.digit, cellS.count, base)
            cellS.digit++
        }
        else if (cellS.count > 1n) {
            permutationsSaved = getPermutations(cellS.digit, cellS.count - 1n, base)
            splitAfterCell(currentNo, cellS, 1n)
        }
        return permutationsSaved
    }
    const fn30 = (currentNo, cellU) => {
        let permutationsSaved = 0n

        const cell2 = currentNo.getCellOf(2n)
        const cell4 = currentNo.getCellOf(4n)
        const cell6 = currentNo.getCellOf(6n)
        const cell8 = currentNo.getCellOf(8n)
        const cellA = currentNo.getCellOf(10n)
        const cellC = currentNo.getCellOf(12n)
        const cellE = currentNo.getCellOf(14n)
        const cellG = currentNo.getCellOf(16n)
        const cellI = currentNo.getCellOf(18n)
        const cellK = currentNo.getCellOf(20n)
        const cellM = currentNo.getCellOf(22n)
        const cellO = currentNo.getCellOf(24n)
        const cellQ = currentNo.getCellOf(26n)
        const cellS = currentNo.getCellOf(28n)

        if (cellS?.count > 1n || cellQ?.count > 3n || cellO?.count > 1n || cellM?.count > 3n || cellK?.count > 1n || cellI?.count > 3n || cellG || cellE?.count > 3n || cellC?.count > 1n || cellA?.count > 3n || cell8?.count > 1n || cell6?.count > 3n || cell4?.count > 1n || cell2?.count > 3n ||
            (cellS && (cellQ?.count > 2n || cellO || cellM?.count > 1n  || cellK || cellI?.count > 1n || cellE?.count > 1n || cellC || cellA?.count > 1n || cell8 || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellQ && (cellO || cellM?.count > 2n  || cellK?.count > 1n || cellI?.count > 2n || cellE?.count > 2n || cellC?.count > 1n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellO && (cellM || cellK || cellI || cellE || cellC || cellA || cell8 || cell6 || cell4 || cell2)) ||
            (cellM && (cellK?.count > 1n || cellI?.count > 2n || cellE?.count > 2n || cellC?.count > 1n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellK && (cellI?.count > 1n || cellE?.count > 1n || cellC || cellA?.count > 1n || cell8 || cell6?.count > 1n || cell4 || cell2?.count > 1n)) ||
            (cellI && (cellE?.count > 2n || cellC?.count > 1n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellE && (cellC?.count > 1n || cellA?.count > 2n || cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cellC && (cellA?.count > 1n ||cell8 || cell6?.count > 1n || cell4 || cell2?.count > 1n )) ||
            (cellA && (cell8 || cell6?.count > 2n || cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell8 && (cell6 || cell4 || cell2)) ||
            (cell6 && (cell4?.count > 1n || cell2?.count > 2n)) ||
            (cell4 && cell2?.count > 1n)
        ) {
            permutationsSaved = getPermutations(cellU.digit, cellU.count, base)
            cellU.digit++
        }
        else if (cellU.count > 3n) {
            permutationsSaved = getPermutations(cellU.digit, cellU.count - 3n, base)
            splitAfterCell(currentNo, cellU, 3n)
        }
        return permutationsSaved
    }

    const checkingFns = {
        2n: fn2,
        4n: fn4,
        6n: fn6,
        8n: fn8,
        10n: fn10,
        12n: fn12,
        14n: fn14,
        16n: fn16,
        18n: fn18,
        20n: fn20,
        22n: fn22,
        24n: fn24,
        26n: fn26,
        28n: fn28,
        30n: fn30,
    }
    return (currentNo) => {
        const checkCell = currentNo.firstCell
        let permutationsSaved = 0n
        let skip = false

        if (!(checkCell.digit % 2n)) {
            permutationsSaved = checkingFns[checkCell.digit](currentNo, checkCell)
            //skip = currentNo.countEvenDigits() > 4
        }
        return permutationsSaved
    }
})()
const base00087 = (() => {
    const base = 87n
    return (currentNo) => {
        let permutationsSaved = 0n

        let [cell29, indexOf29] = currentNo.includesCellOf(29n)
        let [cell58, indexOf58] = currentNo.includesCellOf(58n)
        if (cell29 || cell58) {
            let cell3Division = null
            let indexOfCell3Division = -1
            for (let index = 0; index < currentNo.cellsArr.length; index++) {
                let cell = currentNo.cellsArr[index]
                if (!(cell.digit % 3n)) {
                    cell3Division = cell
                    indexOfCell3Division = index
                    break
                }
            }
            if (cell3Division) {
                const cell2958 = (cell58 || cell29)
                if (indexOf29 === 0 || indexOf58 === 0) {
                    permutationsSaved = getPermutations(cell2958.digit, cell2958.count, base)
                    cell2958.digit++
                    return permutationsSaved
                }
                if (indexOfCell3Division === 0) {
                    permutationsSaved = getPermutations(cell3Division.digit, cell3Division.count, base)
                    cell3Division.digit++
                }
            }
        }
        return permutationsSaved
    }
})()