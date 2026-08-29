import { digitsObj as baseDigits, digitsValue, toBigInt } from '../Digits/index.js'
import { testDigitCellFactory } from './utils.js'

/**
 * A single digit-cell in the HugeInt linked list.
 *
 * @typedef {Object} DigitCell
 * @property {boolean} changed
 *     Indicates whether the cell was modified since the last persistence calculation.
 *
 * @property {BigInt} count
 *     Number of consecutive occurrences of this digit.
 *
 * @property {BigInt} digit
 *     The digit value (0 ≤ digit < base).
 *
 * @property {DigitCell|null} next
 *     Pointer to the next cell (more significant digit).
 *
 * @property {DigitCell|null} prev
 *     Pointer to the previous cell (less significant digit).
 *
 * @property {BigInt} result
 *     Cached result used by multiplicative persistence algorithms.
 */

/**
 * Represents a large integer using a compressed linked-list structure of digit cells.
 *
 * Each digit cell stores a digit, a count of consecutive repetitions of that digit,
 * and links to previous and next cells. Adjacent cells never contain the same digit;
 * repeated digits are merged into a single cell with count > 1. The list is stored
 * in least-significant-digit-first order, where `firstCell` is the lowest digit and
 * `lastCell` is the highest digit.
 *
 * @class HugeInt
 */
export class HugeInt {

    /**
     * Constructs a HugeInt instance from an initial BigInt value.
     *
     * If the initial value is 0n, a single cell containing digit 0 is created.
     * Otherwise, the value is decomposed into digits in the given base and
     * compressed into digit cells where consecutive identical digits share a cell
     * with an increased count.
     *
     * @constructor
     * @param {BigInt} [initValue=0n]
     *     Initial numeric value to represent.
     *
     * @param {BigInt} [base=10n]
     *     Numerical base used for digit decomposition.
     *
     * @param {() => DigitCell} [digitCellFactory]
     *     Factory function that creates new DigitCell objects. It is validated once
     *     and then used for every cell creation.
     *
     * @returns {HugeInt}
     */
    constructor(initValue = 0n, base = 10n, digitCellFactory = undefined) {

        this.#base = base
        this.#baseMinusOne = this.#base - 1n
        this.#digitCellFactory = digitCellFactory || (() => (
                /** @type {DigitCell} */
                {
                    changed: true,
                    count: 1n,
                    digit: 0n,
                    next: null,
                    prev: null,
                })
        )

        if (!testDigitCellFactory(this.#digitCellFactory)) {
            throw new Error('digitCellFactory function must return a valid DigitCell object')
        }

        if (initValue === 0n) {
            this.firstCell = this.#digitCellFactory()
            this.lastCell = this.firstCell
        } else {
            const digit = initValue % base
            initValue /= base
            let currentCell = this.#digitCellFactory()
            currentCell.digit = digit
            this.firstCell = currentCell
            while (initValue !== 0n) {
                const digit = initValue % base
                initValue /= base
                if (currentCell.digit === digit) {
                    currentCell.count++
                } else {
                    currentCell.next = this.#digitCellFactory()
                    currentCell.next.digit = digit
                    currentCell.next.prev = currentCell
                    currentCell = currentCell.next
                }
            }
            this.lastCell = currentCell
        }
    }

    /**
     * Base used for digit decomposition and arithmetic.
     *
     * @private
     * @type {BigInt}
     */
    #base

    /**
     * Cached value of (base - 1n), used for geometric series calculations.
     *
     * @private
     * @type {BigInt}
     */
    #baseMinusOne

    /**
     * Factory function used to create new DigitCell objects.
     *
     * @private
     * @type {() => DigitCell}
     */
    #digitCellFactory

    /**
     * Returns the numerical base used by this HugeInt.
     *
     * @readonly
     * @returns {BigInt}
     */
    get base() {
        return this.#base
    }

    /**
     * Returns the digit-cell immediately preceding the last (most significant) cell.
     *
     * If the number contains only one cell, this getter returns `null`.
     *
     * @readonly
     * @returns {DigitCell|null}
     */
    get beforeLastCell() {
        return this.lastCell.prev
    }

    /**
     * Returns the number of digit-cells in the linked list.
     *
     * This counts distinct digit groups, not the total number of digits.
     *
     * @readonly
     * @returns {number}
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
     * First digit-cell (the least significant digit).
     * Always non-null after construction.
     *
     * @type {DigitCell}
     */
    firstCell

    /**
     * Last digit-cell (the most significant digit).
     * Always non-null after construction.
     *
     * @type {DigitCell}
     */
    lastCell

    /**
     * Returns the total number of digits represented by the HugeInt.
     *
     * This is computed by summing the `count` field of each digit-cell.
     *
     * @readonly
     * @returns {BigInt}
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
     * Returns the second digit-cell (the one after `firstCell`).
     *
     * If the number contains only one cell, this returns `null`.
     *
     * @readonly
     * @returns {DigitCell|null}
     */
    get secondCell() {
        return this.firstCell.next
    }

    /**
     * Computes and returns the full numeric value represented by the HugeInt.
     *
     * The value is reconstructed by expanding each digit-cell into its repeated digits
     * and applying the appropriate powers of the base. Geometric series are used to
     * compute repeated-digit blocks efficiently.
     *
     * @readonly
     * @returns {BigInt}
     */
    get value() {
        const o = this
        let value = 0n
        let power = 0n
        let cell = this.firstCell

        while (cell) {
            value += cell.digit * (((o.#base ** cell.count) - 1n) / o.#baseMinusOne) * (o.#base ** power)
            power += cell.count

            cell = cell.next
        }
        return value
    }

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@METHODS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */

    /**
     * Inserts a new digit-cell immediately after the specified `currentCell`.
     *
     * Updates the `prev` and `next` pointers of the involved cells and, if the
     * inserted cell becomes the last cell, updates `this.lastCell` accordingly.
     *
     * @method addCellAfter
     * @param {DigitCell} currentCell
     *     The cell after which the new cell will be inserted.
     *
     * @param {DigitCell} cell
     *     The new cell to insert. Caller must ensure its fields are valid.
     *
     * @returns {DigitCell}
     *     The inserted cell.
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
     * Inserts a new digit-cell immediately before the specified `currentCell`.
     *
     * Updates the `prev` and `next` pointers of the involved cells and, if the
     * inserted cell becomes the first cell, updates `this.firstCell` accordingly.
     *
     * @method addCellBefore
     * @param {DigitCell} currentCell
     *     The cell before which the new cell will be inserted.
     *
     * @param {DigitCell} cell
     *     The new cell to insert.
     *
     * @returns {DigitCell}
     *     The inserted cell.
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
     * Replaces the current HugeInt contents with a new value parsed from a string.
     *
     * The string is split into groups of repeated digits, each group is converted
     * into a digit-cell with `count` equal to the group length, and the linked list
     * is rebuilt from least-significant to most-significant digit. The internal base
     * fields (`#base`, `#baseMinusOne`) are updated to match the provided base.
     *
     * @method fromString
     * @param {string} str
     *     String representation of the number in the given base.
     *
     * @param {BigInt} base
     *     Numerical base used to interpret the digits.
     *
     * @returns {HugeInt}
     *     The mutated instance (for chaining).
     */
    fromString(str, base) {
        const digitsArr = str.match(/((.)\2*)/g) || [str]

        this.#base = base
        this.#baseMinusOne = this.#base - 1n

        let currentCell = this.#digitCellFactory()
        this.firstCell = currentCell

        for (let index = digitsArr.length - 1; index > -1; index--) {

            currentCell.count = toBigInt[digitsArr[index].length]
            currentCell.digit = digitsValue[digitsArr[index][0]]

            currentCell.next = this.#digitCellFactory()
            currentCell.next.prev = currentCell
            currentCell = currentCell.next
        }
        this.lastCell = currentCell.prev
        this.lastCell.next = null

        return this
    }

    static maxBigInt = (...args) => args.reduce((a, b) => (a > b ? a : b))
    static minBigInt = (...args) => args.reduce((a, b) => (a < b ? a : b))

    /**
     * A single digit-cell in the HugeInt linked list.
     *
     * Each cell tracks whether it was changed, the number of consecutive occurrences
     * of its digit, the digit value itself, links to neighboring cells, and an
     * optional cached result used by multiplicative persistence algorithms.
     *
     * @typedef {Object} DigitCell
     * @property {boolean} changed
     *     Indicates whether the cell was modified since the last persistence calculation.
     *
     * @property {BigInt} count
     *     Number of consecutive occurrences of this digit.
     *
     * @property {BigInt} digit
     *     The digit value (0 ≤ digit < base).
     *
     * @property {DigitCell|null} next
     *     Pointer to the next cell (more significant digit).
     *
     * @property {DigitCell|null} prev
     *     Pointer to the previous cell (less significant digit).
     *
     * @property {BigInt} result
     *     Cached result used by multiplicative persistence algorithms.
     */
    add(hugeInt) {

        if (this.#base !== hugeInt.base) {
            throw new Error('Base is incompatible.')
        }
        const newCell = this.#digitCellFactory()
        newCell.digit = -1n
        const firstLength = HugeInt.maxBigInt(this.length, hugeInt.length)
        const firstHugeInt = this.length >= hugeInt.length ? this : hugeInt
        const secondHugeInt = this.length >= hugeInt.length ? hugeInt : this
        const base = this.#base

        let carry = 0n

        let firstCell = firstHugeInt.firstCell
        let secondCell = secondHugeInt.firstCell
        let firstIndex = 0n
        let secondIndex = 0n
        let aNewCell = /*** @type {DigitCell} */ { ...newCell }
        const aNewFirstCell = aNewCell

        for (let index = 0; index < firstLength; index++) {

            firstIndex++
            secondIndex++

            let secondDigit = secondCell ? secondCell.digit : 0n
            let sum = firstCell.digit + secondDigit + carry
            let digit = sum % base
            carry = sum / base

            if (aNewCell.digit === -1n) {
                aNewCell.count = 1n
                aNewCell.digit = digit
            }
            else if (aNewCell.digit === digit) {
                aNewCell.count++
            }
            else {
                aNewCell.next = /*** @type {DigitCell} */ { ...newCell }
                aNewCell.next.prev = aNewCell
                aNewCell = aNewCell.next
                aNewCell.count = 1n
                aNewCell.digit = digit
            }

            if (firstIndex === firstCell.count) {
                firstIndex = 0n
                firstCell = firstCell.next
            }
            if (secondCell && secondIndex === secondCell.count) {
                secondIndex = 0n
                secondCell = secondCell.next
            }
        }
        if (carry > 0n) {
            aNewCell.next = /*** @type {DigitCell} */ { ...newCell }
            aNewCell.next.prev = aNewCell
            aNewCell = aNewCell.next
            aNewCell.count = 1n
            aNewCell.digit = carry
        }
        this.firstCell = aNewFirstCell
        this.lastCell = aNewCell

        return this
    }

    /**
     * Increments the HugeInt by exactly 1, mutating the digit-cell structure in place.
     *
     * The specified cell (or the least-significant cell by default) is incremented,
     * splitting the cell if it has a count greater than 1, handling rollover when the
     * digit reaches `base - 1`, and propagating carry to more significant cells as
     * needed. A new cell is appended if rollover occurs at the most significant cell.
     *
     * @method addOne
     * @param {DigitCell|null} [cell=this.firstCell]
     *     The cell to increment. Defaults to the least-significant digit.
     *
     * @returns {void}
     */
    addOne(cell) {
        cell ??= this.firstCell
        cell.changed = true
        let cellToAdd

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }
            cellToAdd = this.#digitCellFactory()
            cellToAdd.count = cell.count - 1n
            cellToAdd.digit = cell.digit
            this.addCellAfter(cell, cellToAdd)
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
            cellToAdd = this.#digitCellFactory()
            cellToAdd.digit = 2n //1n
            this.addCellAfter(cell, cellToAdd)
            return
        }
        this.addOne(cell.next)
    }

    /**
     * Increments the HugeInt by 1, assuming digit-cells are sorted in ascending order.
     *
     * The specified cell (or the least-significant cell by default) is incremented.
     * If the digit is below `base - 1`, it is increased directly, splitting the cell
     * when needed. If the digit equals `base - 1`, it is set to 0 and carry is
     * propagated to the next cell. If no next cell exists, a new cell with digit `2n`
     * is appended.
     *
     * @method addOneToSorted
     * @param {DigitCell} [cell=this.firstCell]
     *     The cell to increment.
     *
     * @returns {void}
     */
    addOneToSorted(cell = this.firstCell) {
        let cellToAdd
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }
            cellToAdd = this.#digitCellFactory()
            cellToAdd.count = cell.count -1n
            cellToAdd.digit = cell.digit

            this.addCellAfter(cell, cellToAdd)
            cell.count = 1n
            cell.digit++
            return
        }

        cell.digit = 0n

        if (!cell.next) {
            cellToAdd = this.#digitCellFactory()
            cellToAdd.digit = 2n
            this.addCellAfter(cell, cellToAdd)
            return
        }
        this.addOneToSorted(cell.next)
    }

    /**
     * Removes a digit-cell from the linked list.
     *
     * Adjusts neighboring cell pointers and updates `firstCell` or `lastCell`
     * when removing the first or last cell.
     *
     * @method removeCell
     * @param {DigitCell} cell
     *     The cell to remove.
     *
     * @returns {void}
     */
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

    /**
     * Decrements the HugeInt by 1, mutating the digit-cell structure in place.
     *
     * The specified cell (or the least-significant cell by default) is decremented.
     * If the digit is above 0, it is decreased directly, splitting the cell when
     * needed. If the digit is 0, it becomes `base - 1` and borrow is propagated to
     * the next cell. If borrow reaches the last cell, it becomes a single zero-digit.
     *
     * @method subtractOne
     * @param {DigitCell|null} [cell=this.firstCell]
     *     The cell to decrement.
     *
     * @returns {void}
     */
    subtractOne(cell) {
        cell ??= this.firstCell
        let cellToAdd

        if (cell.digit !== 0n) {
            if (cell.count === 1n) {
                cell.digit--
                return
            } else {
                cellToAdd = this.#digitCellFactory()
                cellToAdd.count = cell.count -1n
                cellToAdd.digit = cell.digit

                this.addCellAfter(cell, cellToAdd)
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

    /**
     * Determines whether the HugeInt represents a value greater than or equal to the base.
     *
     * Returns true if the number contains more than one digit, either by having
     * multiple cells or a single cell with count greater than 1.
     *
     * @method isGTBase
     * @returns {boolean}
     *     Whether the number contains more than one digit.
     */
    isGTBase() {
        return this.firstCell.count > 1n || this.firstCell.next
    }

    /**
     * Counts how many times a specific digit appears in the HugeInt.
     *
     * Iterates through all digit-cells and sums the counts of cells whose digit
     * matches the requested value.
     *
     * @method digitCount
     * @param {BigInt} digit
     *     The digit to count.
     *
     * @returns {BigInt}
     *     Total occurrences of the digit.
     */
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
     * Returns the first digit-cell whose digit matches the specified value.
     *
     * Scans the linked list from least-significant to most-significant digit and
     * returns the first matching cell, or null if none exists.
     *
     * @method getCellOf
     * @param {BigInt} digit
     *     The digit to search for.
     *
     * @returns {DigitCell|null}
     *     The matching cell, or null if not found.
     */
    getCellOf(digit) {
        let cell = this.firstCell
        do {
            if (cell.digit === digit) return cell
            cell = cell.next
        } while (cell)
        return null
    }

    /**
     * Checks whether the HugeInt contains at least one occurrence of the specified digit.
     *
     * Returns true upon the first match while scanning the digit-cells.
     *
     * @method isCellOf
     * @param {BigInt} digit
     *     The digit to search for.
     *
     * @returns {boolean}
     *     Whether the digit exists in the HugeInt.
     */
    isCellOf(digit) {
        let cell = this.firstCell
        do {
            if (cell.digit === digit) return true
            cell = cell.next
        } while (cell)
        return false
    }

    /**
     * Determines whether the HugeInt represents a value less than the base.
     *
     * Returns true only if the number consists of exactly one digit-cell with
     * count equal to 1.
     *
     * @method isLTBase
     * @returns {boolean}
     *     Whether the number is a single digit.
     */
    isLTBase() {
        return (!this.firstCell.next) && this.firstCell.count === 1n
    }

    /**
     * Returns the least-significant digit of the HugeInt.
     *
     * Equivalent to `value % base` but computed in constant time using the first cell.
     *
     * @method moduloBase
     * @returns {BigInt}
     *     The least-significant digit.
     */
    moduloBase() {
        return this.firstCell.digit
    }

    /**
     * Checks whether the HugeInt contains at least one even digit.
     *
     * Iterates through all digit-cells and returns true if any digit is divisible by 2.
     *
     * @method hasEvenDigits
     * @returns {boolean}
     *     Whether the number contains any even digit.
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
     * Counts the total number of factors of 2 contributed by all digits in the HugeInt.
     *
     * For each digit-cell, computes log2(digit). If the digit is a power of two,
     * multiplies that exponent by the cell's count and adds it to the total.
     *
     * @method countTwoComponents
     * @param {DigitCell|null} [cell=this.firstCell]
     *     Starting cell for the scan.
     *
     * @returns {number}
     *     Total exponent of 2 contributed by all digits.
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
     * Counts the total number of factors of 2 contributed by all digits,
     * excluding the least-significant digit-cell.
     *
     * @method countTwoComponentsNoFirstCell
     * @returns {number}
     *     Total exponent of 2 contributed by all digits except the first cell.
     */
    countTwoComponentsNoFirstCell() {
        return this.countTwoComponents(this.firstCell.next)
    }

    /**
     * Splits a digit-cell into two consecutive cells, placing the new cell after the given cell.
     *
     * The original cell keeps `countToSplit` digits. The new cell receives the remaining digits
     * and is inserted immediately after the original cell.
     *
     * @method splitCellAfter
     * @param {DigitCell} cell
     *     The cell to split.
     *
     * @param {BigInt} countToSplit
     *     Number of digits to keep in the original cell.
     *
     * @returns {DigitCell}
     *     The newly created cell containing the remainder of the digits.
     */
    splitCellAfter(cell, countToSplit) {
        const newCell = this.#digitCellFactory()
        newCell.count = cell.count - countToSplit
        newCell.digit = cell.digit

        this.addCellAfter(cell, newCell)
        cell.count = countToSplit
        cell.changed = true
        return newCell
    }

    /**
     * Splits a digit-cell into two consecutive cells, placing the new cell before the given cell.
     *
     * The new cell receives `countToSplit` digits. The original cell's count is reduced
     * accordingly, and the new cell is inserted immediately before the original cell.
     *
     * @method splitCellBefore
     * @param {DigitCell} cell
     *     The cell to split.
     *
     * @param {BigInt} countToSplit
     *     Number of digits to extract into the new cell.
     *
     * @returns {DigitCell}
     *     The newly created cell containing the extracted digits.
     */
    splitCellBefore(cell, countToSplit) {
        const newCell = this.#digitCellFactory()
        newCell.count = cell.count - countToSplit
        newCell.digit = cell.digit

        this.addCellBefore(cell, newCell)
        cell.count -= countToSplit
        cell.changed = true
        return newCell
    }

    /**
     * Converts the HugeInt into a plain string representation in its current base.
     *
     * Expands each digit-cell into repeated digit characters and concatenates them
     * from most-significant to least-significant digit.
     *
     * @method toString
     * @returns {string}
     *     The full string representation of the HugeInt.
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
     * Converts the HugeInt into a comma-separated string representation.
     *
     * Formats the full digit string into groups of three digits separated by commas.
     *
     * @method toLocaleString
     * @returns {string}
     *     A comma-separated representation of the HugeInt.
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
     * Enables iteration over all digit-cells in the HugeInt.
     *
     * Yields each digit-cell from least-significant to most-significant digit.
     *
     * @method [Symbol.iterator]
     * @returns {Iterator<DigitCell|null>}
     *     An iterator over all digit-cells.
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
