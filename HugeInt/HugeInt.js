import { digitsObj as baseDigits, digitsValue, toBigInt } from '../Digits/index.js'

/**
 * @typedef DigitCell
 * @property {boolean} changed
 * @property {bigint} count
 * @property {bigint} digit
 * @property {DigitCell|null} next
 * @property {DigitCell|null} prev
 * @property {bigint} result
 */

/**
 * @class HugeInt
 */

export class HugeInt {

    /**
     *
     * @param {bigint} initValue
     * @param {bigint} base
     */
    constructor(initValue = 0n, base = 10n) {
        this.#base = base
        this.#baseMinusOne = this.#base - 1n

        if (initValue === 0n) {
            this.firstCell = {
                changed: true,
                count: 1n,
                digit: 0n,
                next: null,
                prev: null,
                result: 0n,
            }
            this.lastCell = this.firstCell
        } else {
            const digit = initValue % base
            initValue /= base
            let currentCell = {
                changed: true,
                count: 1n,
                digit,
                next: null,
                prev: null,
                result: 0n,
            }
            this.firstCell = currentCell
            while (initValue !== 0n) {
                const digit = initValue % base
                initValue /= base
                if (currentCell.digit === digit) {
                    currentCell.count++
                } else {
                    currentCell.next = {
                        changed: true,
                        count: 1n,
                        digit,
                        next: null,
                        prev: currentCell,
                        result: 0n,
                    }
                    currentCell = currentCell.next
                }
            }
            this.lastCell = currentCell
        }
    }
    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@PRIVATE FIELDS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */
    #base
    #baseMinusOne

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@GETTERS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */

    /**
     *
     * @readonly
     * @property {DigitCell} beforeLastCell
     */
    get beforeLastCell() {
        return this.lastCell.prev
    }

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
     * @type {DigitCell | null}
     */
    firstCell = null

    /**
     *
     * @type {DigitCell | null}
     */
    lastCell = null

    /**
     *
     * @readonly
     * @property {bigint} length
     */
    get length() {
        let count = 0n
        let cell = this.firstCell
        while (cell) {
            count += cell.count
            cell = cell.next
        }
        return count
    }

    /**
     *
     * @readonly
     * @property {DigitCell} secondCell
     */
    get secondCell() {
        return this.firstCell.next
    }

    /**
     *
     * @readonly
     * @property {bigint} value
     */
    get value() {
        const o = this
        let value = 0n;
        let power = 0n;
        let cell = this.firstCell;

        while (cell) {
            value += cell.digit * (((o.#base ** cell.count) - 1n) / o.#baseMinusOne) * (o.#base ** power)
            power += cell.count

            cell = cell.next;
        }
        return value;
    }

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@METHODS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */

    /**
     * @method addCellAfter
     * @param {DigitCell} currentCell
     * @param {DigitCell} cell
     * @return {DigitCell}
     */
    addCellAfter(currentCell, cell) {
        currentCell.next && (currentCell.next.prev = cell)

        cell.next = currentCell.next
        currentCell.next = cell
        cell.prev = currentCell

        !cell.next && (this.lastCell = cell)

        return cell
    }

    /**
     * @method addCellBefore
     * @param {DigitCell} currentCell
     * @param {DigitCell} cell
     * @return {DigitCell}
     */
    addCellBefore(currentCell, cell) {
        currentCell.prev && (currentCell.prev.next = cell)
        cell.prev = currentCell.prev
        currentCell.prev = cell
        cell.next = currentCell

        !cell.prev && (this.firstCell = cell)

        return cell
    }

    /**
     * @method fromString
     * @param {string} str
     * @param {bigint} base
     */
    fromString(str, base) {
        const digitsArr = str.match(/((.)\2*)/g) || [str]

        this.#base = base
        this.#baseMinusOne = this.#base - 1n

        let currentCell = this.firstCell

        for (let index = digitsArr.length - 1; index > -1; index--) {

            currentCell.count = toBigInt[digitsArr[index].length]
            currentCell.digit = digitsValue[digitsArr[index][0]]

            currentCell.next = {
                changed: true,
                count: 0n,
                digit: 0n,
                next: null,
                prev: currentCell,
                result: 0n,
            }
            currentCell = currentCell.next
        }
        this.lastCell = currentCell.prev
        this.lastCell.next = null
    }

    addOne(cell) {
        cell ??= this.firstCell
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }
            this.addCellAfter(cell, {
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

        if (cell.prev && cell.prev.digit === 0n) {
            cell.count += cell.prev.count
            this.removeCell(cell.prev)
        }
        if (cell === this.lastCell) {
            this.addCellAfter(cell, {
                changed: true,
                count: 1n,
                digit: 2n, // 1n
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
     * @param {DigitCell|null} cell
     */
    addOneToSorted(cell = this.firstCell) {
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }

            this.addCellAfter(
                /** @type {DigitCell} */ cell, {
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
                /** @type {DigitCell} */ cell, {
                changed: true,
                count: 1n,
                digit: 2n,
                next: null,
                prev: null,
                result: 0n,
            })
            return
        }
        this.addOneToSorted(cell.next)
    }

    removeCell(cell) {
        if (cell.prev) {
            cell.prev.next = cell.next
        }
        else {
            this.firstCell = cell.next
        }
        if (cell.next) {
            cell.next.prev = cell.prev
        }
        else {
            this.lastCell = cell.prev
        }

    }
    subtractOne(cell) {
        cell ??= this.firstCell

        if (cell.digit !== 0n) {
            if (cell.count === 1n) {
                cell.digit--
                return
            } else {
                this.addCellAfter(cell, {
                    changed: true,
                    count: cell.count - 1n,
                    digit: cell.digit,
                    next: null,
                    prev: null,
                    result: 0n,
                })
                cell.count = 1n
                cell.digit--
                return
            }
        }

        cell.digit = this.#baseMinusOne

        if (cell === this.lastCell) {
            cell.count = 1n
            cell.digit = 0n
            return
        }
        this.subtractOne(cell.next)
    }

    isGTBase() {
        return this.firstCell.count > 1n || this.firstCell.next
    }

    digitCount(digit) {
        let cell = this.firstCell
        let count = 0n
        while (cell) {
            if (cell.digit === digit) count += cell.count
            cell = cell.next
        }
        return count
    }
    /**
     *
     * @return {DigitCell|null}
     */
    getCellOf(digit) {
        let cell = this.firstCell
        while (cell) {
            if (cell.digit === digit) return cell
            cell = cell.next
        }
        return null
    }
    /**
     *
     * @return {boolean}
     */
    isCellOf(digit) {
        let cell = this.firstCell
        while (cell) {
            if (cell.digit === digit) return true
            cell = cell.next
        }
        return false
    }
    /**
     *
     * @return {boolean}
     */
    isLTBase() {
        return (!this.firstCell.next) && this.firstCell.count === 1n
    }
    /**
     *
     * @return {bigint}
     */
    moduloBase() {
        return this.firstCell.digit
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
    countTwoComponentsNoFirstCell() {
        return this.countTwoComponents(this.firstCell.next)
    }
    /**
     *
     * @param {DigitCell} cell
     * @param {bigint} countToSplit
     * @return {DigitCell}
     */
    splitCellAfter(cell, countToSplit) {
        const newCell = {
            changed: true,
            count: cell.count - countToSplit,
            digit: cell.digit,
            next: null,
            prev: null,
            result: 0n
        }
        this.addCellAfter(cell, newCell)
        cell.count = countToSplit
        cell.changed = true
        return newCell
    }
    /**
     *
     * @param {DigitCell} cell
     * @param {bigint} countToSplit
     * @return {DigitCell}
     */
    splitCellBefore(cell, countToSplit) {
        const newCell = {
            changed: true,
            count: countToSplit,
            digit: cell.digit,
            next: null,
            prev: null,
            result: 0n
        }
        this.addCellBefore(cell, newCell)
        cell.count -= countToSplit
        cell.changed = true
        return newCell
    }
    /**
     * @method toString
     * @return {string}
     */
    toString() {
        let tmpStr = ''
        let cell = this.lastCell

        do {
            tmpStr += baseDigits.get(cell.digit).repeat(Number(cell.count))

            cell = cell.prev
        } while (cell)

        return tmpStr
    }
    /**
     * @method toLocaleString
     * @return {string}
     */
    toLocaleString() {
        const str = this.toString()
        const arr = []
        let partLength = str.length % 3 || 3
        let index = 0
        do {
            arr.push(str.substring(index, index + partLength))
            index += partLength
            partLength = 3
        } while (index !== str.length)

        return arr.join(',')
    }
    /**
     *
     * @return {Iterator}
     */
    *[Symbol.iterator] () {
        let cell = this.firstCell
        while (cell) {
            yield cell
            cell = cell.next
        }
        return null
    }
}

export default HugeInt
