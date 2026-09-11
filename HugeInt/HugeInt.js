import { digitsObj as baseDigits, digitsValue, toBigInt } from '../Digits/index.js'
import { testDigitCellFactory } from './utils.js'
import {
    addGroups,
    bigIntToGroups,
    BudgetExceededError,
    groupsToBigInt,
    multiplyGroups,
    multiplyGroupsByDigit,
} from './multiply.js'

/**
 * A single digit-cell in the HugeInt linked list.
 *
 * @typedef {Object} DigitCell
 * @property {boolean} changed - Whether the cell was touched since the last persistence pass (used by the search via HugeIntEx).
 * @property {BigInt} count - Number of consecutive occurrences of this digit.
 * @property {BigInt} digit - The digit value (0 ≤ digit < base).
 * @property {DigitCell|null} next - Next cell (more significant digit).
 * @property {DigitCell|null} prev - Previous cell (less significant digit).
 */

/**
 * Default {@link DigitCell} factory: a fresh, unlinked cell holding digit 0.
 *
 * @type {() => DigitCell}
 */
export const defaultDigitCellFactory = () => ({
    changed: true,
    count: 1n,
    digit: 0n,
    next: null,
    prev: null,
})

/**
 * A large integer as a run-length-compressed linked list of digit cells, least-significant
 * first. Each cell is `{ digit, count, prev, next }`; adjacent cells never share a digit.
 *
 * @class HugeInt
 */
export class HugeInt {

    /**
     * @constructor
     * @param {BigInt} [initValue=0n]
     * @param {BigInt} [base=10n]
     * @param {() => DigitCell} [digitCellFactory] validated once, then used for every cell
     * @returns {HugeInt}
     */
    constructor(initValue = 0n, base = 10n, digitCellFactory = undefined) {

        this.#base = base
        this.#baseMinusOne = this.#base - 1n
        this.#digitCellFactory = digitCellFactory || defaultDigitCellFactory

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

    /** @private @type {BigInt} base used for digit decomposition and arithmetic */
    #base

    /** @private @type {BigInt} cached `base - 1n`, for geometric-series sums */
    #baseMinusOne

    /** @private @type {() => DigitCell} */
    #digitCellFactory

    /**
     * The numerical base.
     *
     * @readonly
     * @returns {BigInt}
     */
    get base() {
        return this.#base
    }

    /**
     * The cell before the last one, or `null` when there is only one cell.
     *
     * @readonly
     * @returns {DigitCell|null}
     */
    get beforeLastCell() {
        return this.lastCell.prev
    }

    /**
     * Number of digit-cells (distinct digit groups), not the digit count.
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

    /** @type {DigitCell} first digit-cell (least significant), non-null after construction */
    firstCell

    /** @type {DigitCell} last digit-cell (most significant), non-null after construction */
    lastCell

    /**
     * Total digit count (sum of every cell's `count`).
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
     * The cell after `firstCell`, or `null` when there is only one cell.
     *
     * @readonly
     * @returns {DigitCell|null}
     */
    get secondCell() {
        return this.firstCell.next
    }

    /**
     * The full numeric value.
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
     * Inserts `cell` immediately after `currentCell`, updating `lastCell` if needed.
     *
     * @method addCellAfter
     * @param {DigitCell} currentCell
     * @param {DigitCell} cell caller must ensure its fields are valid
     * @returns {DigitCell} the inserted cell
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
     * Inserts `cell` immediately before `currentCell`, updating `firstCell` if needed.
     *
     * @method addCellBefore
     * @param {DigitCell} currentCell
     * @param {DigitCell} cell
     * @returns {DigitCell} the inserted cell
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
     * Replaces the contents with the number parsed from `str`, and switches to `base`.
     *
     * @method fromString
     * @param {string} str number in `base`
     * @param {BigInt} base
     * @returns {HugeInt} `this`
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
     * Whether this HugeInt represents zero.
     *
     * @returns {boolean}
     */
    isZero() {
        return !this.firstCell.next && this.firstCell.digit === 0n
    }

    /**
     * Snapshots the digit-cells as {@link DigitGroups}.
     *
     * @returns {DigitGroups}
     */
    #toGroups() {
        const groups = []
        for (let cell = this.firstCell; cell; cell = cell.next) {
            groups.push([cell.digit, cell.count])
        }
        return groups
    }

    /**
     * Rebuilds the digit-cell list from `groups`: merges equal neighbours, trims leading zero
     * groups, and guarantees at least one cell.
     *
     * @param {DigitGroups} groups
     * @returns {this}
     */
    #groupsToDigitCells(groups) {
        const factory = this.#digitCellFactory
        let first = null
        let last = null

        for (const [digit, count] of groups) {
            if (count <= 0n) continue
            if (last && last.digit === digit) {
                last.count += count
                continue
            }
            const cell = factory()
            cell.digit = digit
            cell.count = count
            cell.prev = last
            cell.next = null
            if (last) last.next = cell
            else first = cell
            last = cell
        }

        while (last && last.prev && last.digit === 0n) {
            last = last.prev
            last.next = null
        }
        if (!first) first = last = factory()
        else if (first === last && first.digit === 0n) first.count = 1n

        this.firstCell = first
        this.lastCell = last
        return this
    }

    /**
     * Coerces an operand to {@link DigitGroups} in this HugeInt's base.
     *
     * @param {HugeInt | bigint | number} other
     * @returns {DigitGroups}
     */
    #coerceToGroups(other) {
        if (other instanceof HugeInt) {
            if (other.#base !== this.#base) throw new Error('Base is incompatible.')
            return other.#toGroups()
        }
        if (typeof other === 'bigint') return bigIntToGroups(other, this.#base)
        if (typeof other === 'number') {
            if (!Number.isInteger(other)) throw new RangeError('HugeInt: expected an integer')
            return bigIntToGroups(BigInt(other), this.#base)
        }
        throw new TypeError('HugeInt: expected a HugeInt, bigint, or integer')
    }

    /**
     * Whether {@link value} (with `extraDigits` more digits) fits V8's BigInt
     * size limit, i.e. whether the `bigint` fast path is safe.
     *
     * @param {bigint} [extraDigits]
     * @returns {boolean}
     */
    #fitsBigInt(extraDigits = 0n) {
        const bitsPerDigit = BigInt(Math.ceil(Math.log2(Number(this.#base))) || 1)
        return (this.length + extraDigits) * bitsPerDigit < HugeInt.maxBigIntBits
    }

    /**
     * Builds a HugeInt directly from {@link DigitGroups} (`[[digit, repeatCount], …]`,
     * least-significant group first). Repeat counts may be arbitrarily large.
     *
     * @param {DigitGroups} groups
     * @param {BigInt} [base=10n]
     * @returns {HugeInt}
     */
    static fromGroups(groups, base = 10n) {
        const hugeInt = new HugeInt(0n, base)
        return hugeInt.#groupsToDigitCells(groups.map(([digit, count]) => [BigInt(digit), BigInt(count)]))
    }

    /** Approximate V8 BigInt ceiling in bits; lowered by tests to force the digit-group path. */
    static maxBigIntBits = 1n << 30n

    /**
     * Adds `other` in place, group-wise (`O(groupCount)`).
     *
     * @param {HugeInt | bigint | number} other
     * @returns {this}
     */
    add(other) {
        return this.#groupsToDigitCells(addGroups(this.#toGroups(), this.#coerceToGroups(other), this.#base))
    }

    /**
     * Multiplies this HugeInt in place by a single digit (`0 ≤ digit < base`).
     *
     * @param {bigint} digit
     * @returns {this}
     */
    multiplyByDigit(digit) {
        if (typeof digit !== 'bigint' || digit < 0n || digit >= this.#base) {
            throw new RangeError('HugeInt.multiplyByDigit: expected a bigint digit in [0, base)')
        }
        return this.#groupsToDigitCells(multiplyGroupsByDigit(this.#toGroups(), digit, this.#base))
    }

    /**
     * Multiplies this HugeInt in place by `baseᵏ` (a left digit shift).
     *
     * @param {bigint} k
     * @returns {this}
     */
    shiftLeft(k) {
        if (typeof k !== 'bigint' || k < 0n) {
            throw new RangeError('HugeInt.shiftLeft: expected a non-negative bigint')
        }
        if (k === 0n || this.isZero()) return this
        if (this.firstCell.digit === 0n) {
            this.firstCell.count += k
            return this
        }
        const cell = this.#digitCellFactory()
        cell.digit = 0n
        cell.count = k
        this.addCellBefore(this.firstCell, cell)
        return this
    }

    /**
     * Multiplies `other` in place. Uses the `bigint` fast path when the product fits V8's BigInt
     * limit, else {@link module:HugeInt/multiply} (which may throw {@link BudgetExceededError}).
     *
     * @param {HugeInt | bigint | number} other
     * @param {{ maxCells?: bigint }} [options]
     * @returns {this}
     */
    multiply(other, options) {
        const otherGroups = this.#coerceToGroups(other)

        if (this.isZero() || otherGroups.every(([digit]) => digit === 0n)) {
            return this.#groupsToDigitCells([[0n, 1n]])
        }

        let otherDigits = 0n
        for (const [, count] of otherGroups) otherDigits += count

        if (this.#fitsBigInt(otherDigits)) {
            try {
                return this.#groupsToDigitCells(bigIntToGroups(this.value * groupsToBigInt(otherGroups, this.#base), this.#base))
            } catch (err) {
                if (err.name !== 'RangeError') throw err
            }
        }
        return this.#groupsToDigitCells(multiplyGroups(this.#toGroups(), otherGroups, this.#base, options))
    }

    /**
     * Increments by 1 in place, splitting cells, rolling over at `base - 1`, and carrying to
     * more significant cells (a leading digit-1 cell is appended on top-digit rollover).
     *
     * @method addOne
     * @param {DigitCell|null} [cell=this.firstCell] cell to increment
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
            cellToAdd.digit = 1n
            this.addCellAfter(cell, cellToAdd)
            return
        }
        this.addOne(cell.next)
    }

    /**
     * Removes `cell`, fixing neighbour pointers and `firstCell` / `lastCell`.
     *
     * @method removeCell
     * @param {DigitCell} cell
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
     * Decrements by 1 in place, splitting cells and borrowing through `base - 1` toward the last
     * cell (which collapses to a single zero digit if the borrow reaches it).
     *
     * @method subtractOne
     * @param {DigitCell|null} [cell=this.firstCell] cell to decrement
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
     * Whether the number has more than one digit (value ≥ base).
     *
     * @method isGTBase
     * @returns {boolean}
     */
    isGTBase() {
        return this.firstCell.count > 1n || this.firstCell.next
    }

    /**
     * Total occurrences of `digit`.
     *
     * @method digitCount
     * @param {BigInt} digit
     * @returns {BigInt}
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
     * First digit-cell holding `digit`, or `null`.
     *
     * @method getCellOf
     * @param {BigInt} digit
     * @returns {DigitCell|null}
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
     * Whether `digit` appears anywhere.
     *
     * @method isCellOf
     * @param {BigInt} digit
     * @returns {boolean}
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
     * Whether the number is a single digit (value < base).
     *
     * @method isLTBase
     * @returns {boolean}
     */
    isLTBase() {
        return (!this.firstCell.next) && this.firstCell.count === 1n
    }

    /**
     * The least-significant digit (`value % base`), in constant time.
     *
     * @method moduloBase
     * @returns {BigInt}
     */
    moduloBase() {
        return this.firstCell.digit
    }

    /**
     * Whether any digit is even.
     *
     * @method hasEvenDigits
     * @returns {boolean}
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
     * Exponent of `factor` in the digit product `∏ digitᵢ` — each digit contributes how many
     * times `factor` divides it, times the cell count. Any `factor ≥ 2` (e.g. `2n`: `"4"`→2,
     * `"38"`→3). Digits `factor` doesn't divide (including `0`) contribute nothing.
     *
     * @method factorCountOf
     * @param {BigInt} factor `≥ 2`
     * @param {DigitCell|null} [cell=this.firstCell] first cell to scan; pass `firstCell.next` to skip the LSB run
     * @returns {BigInt}
     */
    factorCountOf(factor, cell = this.firstCell) {

        let total = 0n

        while (cell) {
            let count = 0n
            let digit = cell.digit
            while (digit !== 0n && digit % factor === 0n) {
                digit /= factor;
                count++
            }
            total += count * cell.count
            cell = cell.next
        }

        return total
    }

    /**
     * Splits `cell`, keeping `countToSplit` digits in it and putting the rest in a new cell after it.
     *
     * @method splitCellAfter
     * @param {DigitCell} cell
     * @param {BigInt} countToSplit digits to keep in the original cell
     * @returns {DigitCell} the new cell
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
     * Splits `cell`, moving `countToSplit` digits into a new cell placed before it.
     *
     * @method splitCellBefore
     * @param {DigitCell} cell
     * @param {BigInt} countToSplit digits to extract into the new cell
     * @returns {DigitCell} the new cell
     */
    splitCellBefore(cell, countToSplit) {
        const newCell = this.#digitCellFactory()
        newCell.count = countToSplit
        newCell.digit = cell.digit

        this.addCellBefore(cell, newCell)
        cell.count -= countToSplit
        cell.changed = true
        return newCell
    }

    /**
     * The number as a plain string in its current base.
     *
     * @method toString
     * @returns {string}
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
     * The number as a string grouped into threes by commas.
     *
     * @method toLocaleString
     * @returns {string}
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
     * Iterates the digit-cells, least-significant first.
     *
     * @method [Symbol.iterator]
     * @returns {Iterator<DigitCell|null>}
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

export { BudgetExceededError }
export default HugeInt
