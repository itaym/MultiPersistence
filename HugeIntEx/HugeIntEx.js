/**
 * {@link HugeInt} plus the hooks the multiplicative-persistence search relies on:
 *
 *  - {@link HugeIntEx#addOneToSorted} — increment by 1 for a digit list kept in
 *    ascending order, which also starts every new order of magnitude at digit 2
 *    (a leading 1 is inert in a digit product, so the whole `1…` range is skipped).
 *  - {@link HugeIntEx#countTwoComponents} / {@link HugeIntEx#countTwoComponentsNoFirstCell}
 *    — the "twos in the digit product" vocabulary used by the base-12/24
 *    accommodate rules; thin wrappers over {@link HugeInt#factorCountOf}.
 *  - a cached {@link HugeIntEx#length} — the search reads it every iteration but
 *    it only changes on a rollover, so the O(cells) walk is skipped.
 *
 * The search additionally hangs `changed` / `multiplySum` / `additionSum` on each
 * cell through a custom `digitCellFactory` (see `multiPerSearch.js`) and folds
 * them in `reduceHI`; those fields live on the cells, not on this class.
 *
 * `addOneToSorted` needs the cell factory, which is `#private` to {@link HugeInt},
 * so this subclass keeps its own reference.
 *
 * @module HugeInt/HugeIntEx
 */

import { HugeInt, defaultDigitCellFactory } from '../HugeInt/HugeInt.js'

/**
 * @typedef {import('../HugeInt/HugeInt.js').DigitCell} DigitCell
 */

export class HugeIntEx extends HugeInt {

    /** @type {() => DigitCell} */
    #digitCellFactory

    /** Cached digit count, always valid. @type {BigInt} */
    #length = 0n

    /**
     * @param {BigInt} [initValue=0n]
     * @param {BigInt} [base=10n]
     * @param {() => DigitCell} [digitCellFactory=defaultDigitCellFactory]
     */
    constructor(initValue = 0n, base = 10n, digitCellFactory = defaultDigitCellFactory) {
        super(initValue, base, digitCellFactory)
        this.#digitCellFactory = digitCellFactory
        this.#length = super.length
    }

    /**
     * Total digit count, cached. {@link addOneToSorted} keeps it exact; every
     * other cell-count change recomputes it here.
     *
     * @returns {BigInt}
     */
    get length() {
        return this.#length
    }

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@SEARCH OPERATIONS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */

    /**
     * Advances to the next multiplicative-persistence search candidate: `+1` on a
     * number whose digits read left-to-right in non-decreasing order, so the
     * least-significant cell always holds the largest digit.
     *
     * - digit `< base - 1`: bump it (splitting the run when its count > 1).
     * - least-significant run maxed, with a next cell: those digits plus one
     *   carried digit from the next run all become `nextDigit + 1`, merged into
     *   the least-significant cell. The runs stay merged, so a maxed run only
     *   ever sits at the least-significant end and the carry never propagates
     *   past one cell.
     * - least-significant run maxed, no next cell (all digits `base - 1`): the
     *   run's digit becomes **2** and its count grows by one — every `1…` number
     *   is skipped (a leading 1 is inert in a digit product). This is the only
     *   branch that changes {@link length}.
     *
     * @method addOneToSorted
     * @param {DigitCell} [cell=this.firstCell] - The cell to increment.
     * @returns {void}
     */
    addOneToSorted(cell = this.firstCell) {
        const baseMinusOne = this.base - 1n
        cell.changed = true

        if (cell.digit !== baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }
            const cellToAdd = this.#digitCellFactory()
            cellToAdd.count = cell.count - 1n
            cellToAdd.digit = cell.digit

            this.addCellAfter(cell, cellToAdd)
            cell.count = 1n
            cell.digit++
            return
        }

        if (!cell.next) {
            cell.digit = 2n
            cell.count++
            this.#length += 1n
            return
        }

        const nextCell = cell.next
        nextCell.changed = true

        cell.digit = nextCell.digit + 1n
        cell.count += 1n

        if (nextCell.count === 1n) this.removeCell(nextCell)
        else nextCell.count -= 1n
    }

    /**
     * `factorCountOf(2n, …)` — the base-12/24 accommodate rules read it as
     * "twos in the digit product".
     *
     * @method countTwoComponents
     * @param {DigitCell|null} [cell=this.firstCell] - Starting cell for the scan.
     * @returns {BigInt} - Exponent of 2 in the digit product.
     */
    countTwoComponents(cell) {
        return this.factorCountOf(2n, cell ?? this.firstCell)
    }

    /**
     * `countTwoComponents` starting past the least-significant run.
     *
     * @method countTwoComponentsNoFirstCell
     * @returns {BigInt} - Exponent of 2 in the digit product, excluding the first cell.
     */
    countTwoComponentsNoFirstCell() {
        return this.countTwoComponents(this.firstCell.next)
    }

    /**
     * The digits of this number, smallest first — one entry per cell. The search
     * keeps its numbers sorted with merged groups, so every cell is a distinct
     * digit and this is the digit *set*.
     *
     * @method getDigits
     * @returns {BigInt[]}
     */
    getDigits() {
        const digits = []
        for (let cell = this.lastCell; cell; cell = cell.prev) digits.push(cell.digit)
        return digits
    }

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@LENGTH-CACHE UPKEEP
     * Inherited ops that change the digit count — recompute {@link length} after.
     * None are on the search's hot path.
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */

    /** @param {HugeInt|bigint|number} other @returns {this} */
    add(other) {
        const r = super.add(other)
        this.#length = super.length
        return r
    }

    /** @param {DigitCell|null} [cell] @returns {void} */
    addOne(cell) {
        super.addOne(cell)
        this.#length = super.length
    }

    /**
     * @param {string} str
     * @param {BigInt} base
     * @returns {this}
     */
    fromString(str, base) {
        super.fromString(str, base)
        this.#length = super.length
        return this
    }

    /** @param {HugeInt|bigint|number} other @param {{maxCells?: bigint}} [options] @returns {this} */
    multiply(other, options) {
        const r = super.multiply(other, options)
        this.#length = super.length
        return r
    }

    /** @param {bigint} digit @returns {this} */
    multiplyByDigit(digit) {
        const r = super.multiplyByDigit(digit)
        this.#length = super.length
        return r
    }

    /** @param {bigint} k @returns {this} */
    shiftLeft(k) {
        const r = super.shiftLeft(k)
        this.#length = super.length
        return r
    }

    /** @param {DigitCell|null} [cell] @returns {void} */
    subtractOne(cell) {
        super.subtractOne(cell)
        this.#length = super.length
    }
}

export default HugeIntEx
