import HugeIntClass from "./HugeIntClass.js";

/**
 *
 * @param {DigitCell} cell
 * @param {bigint} baseMinusOne
 * @private
 */
const _addOne = (cell, baseMinusOne) => {
    cell.changed = true

    if (cell.digit !== baseMinusOne) {
        if (cell.count === 1n) {
            cell.digit++
            return
        }

        this.addCellAfter(
            cell, {
                changed: true,
                count: cell.count - 1n,
                digit: cell.digit,
                next: null,
                prev: null,
                result: 0n,
            })
        cell.count = 1n
        cell.digit++
        return
    }

    cell.digit = 0n

    if (!cell.next) {
        this.addCellAfter(
            cell, {
                changed: true,
                count: 1n,
                digit: 2n,
                next: null,
                prev: null,
                result: 0n,
            })
        return
    }
    _addOne(cell.next, baseMinusOne)
}

/**
 * @class HugeInt
 */
export class HugeInt extends HugeIntClass {

    /**
     *
     * @param {bigint} initValue
     * @param {bigint} base
     */
    constructor(initValue = 0n, base = 10n) {
        super(initValue, base)
        this.#base = base
        this.#baseMinusOne = this.#base - 1n
    }

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@PRIVATE FIELDS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */
    #base
    #baseMinusOne

    /**
     *
     * @readonly
     * @property {number} cellsLength
     */
    get cellsLength() {
        let count = 0
        let cell = this.firstCell
        while (cell) {
            count++
            cell = cell.next
        }
        return count
    }

    /**
     *
     * @param {DigitCell} [cell]
     */
    addOne(cell) {
        cell ??= this.firstCell
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }

            this.addCellAfter(
                cell, {
                    changed: true,
                    count: cell.count - 1n,
                    digit: cell.digit,
                    next: null,
                    prev: null,
                    result: 0n,
                })
            cell.count = 1n
            cell.digit++
            return
        }

        cell.digit = 0n

        if (!cell.next) {
            this.addCellAfter(
                cell, {
                    changed: true,
                    count: 1n,
                    digit: 2n,
                    next: null,
                    prev: null,
                    result: 0n,
                })
            return
        }
        this.addOne(cell.next)
    }

    /**
     *
     */
    onNotModuloBase() {
        if (!this.firstCell.digit) {

            const secondCell = this.firstCell.next

            secondCell.count += this.firstCell.count
            secondCell.prev = null

            this.firstCell = secondCell
        }
    }

    /**
     *
     * @return {boolean}
     */
    hasEvenDigits() {
        let cell = this.firstCell
        while (cell) {
            if ((cell.digit % 2n) === 0n) return true
            cell = cell.next
        }
        return false
    }

    /**
     *
     * @param {DigitCell|null} cell
     * @return {number}
     */
    countTwoComponents(cell) {
        cell ??= this.firstCell
        let count = 0
        while (cell) {
            let log2 = Math.log2(Number(cell.digit))
            if (log2 === Math.floor(log2)) {
                count += log2 * Number(cell.count)
            }
            cell = cell.next
        }
        return count
    }

    /**
     *
     * @returns {number}
     */
    countTwoComponentsNoFirstCell() {
        return this.countTwoComponents(this.firstCell.next)
    }
}

export default HugeInt
