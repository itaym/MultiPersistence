/**
 * {@link HugeInt} plus the hooks the multiplicative-persistence search relies on:
 *
 *  - {@link HugeIntEx#addOneToSorted} — `+1` for an ascending-digit number, skipping the `1…` range.
 *  - {@link HugeIntEx#countTwoComponents} / {@link HugeIntEx#countTwoComponentsNoFirstCell} —
 *    "twos in the digit product", wrappers over {@link HugeInt#factorCountOf}.
 *  - a cached {@link HugeIntEx#length}, only recomputed on a rollover.
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
     * Total digit count, cached — {@link addOneToSorted} keeps it exact, other mutators recompute it.
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
     * Next search candidate: `+1` on an ascending-digit number (LSB cell holds the largest digit).
     *
     * - digit `< base - 1`: bump it, splitting the run when count > 1.
     * - LSB run maxed, next cell exists: the run plus one carried digit become `nextDigit + 1`,
     *   merged into the LSB cell; the carry never propagates past one cell.
     * - LSB run maxed, no next cell (all `base - 1`): digit becomes **2**, count grows by one —
     *   the `1…` range is skipped. The only branch that changes {@link length}.
     *
     * @method addOneToSorted
     * @param {DigitCell} [cell=this.firstCell] cell to increment
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
     * `factorCountOf(2n, …)` — "twos in the digit product" for the base-12/24 accommodate rules.
     *
     * @method countTwoComponents
     * @param {DigitCell|null} [cell=this.firstCell] starting cell for the scan
     * @returns {BigInt} exponent of 2 in the digit product
     */
    countTwoComponents(cell) {
        return this.factorCountOf(2n, cell ?? this.firstCell)
    }

    /**
     * `countTwoComponents` starting past the least-significant run.
     *
     * @method countTwoComponentsNoFirstCell
     * @returns {BigInt} exponent of 2 in the digit product, excluding the first cell
     */
    countTwoComponentsNoFirstCell() {
        return this.countTwoComponents(this.firstCell.next)
    }

    /**
     * The distinct digits, smallest first — one per cell (search numbers are sorted, merged runs).
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
