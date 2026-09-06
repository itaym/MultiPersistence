/**
 * {@link HugeInt} plus the hooks the multiplicative-persistence search relies on:
 *
 *  - {@link HugeIntEx#addOneToSorted} — increment by 1 for a digit list kept in
 *    ascending order, which also starts every new order of magnitude at digit 2
 *    (a leading 1 is inert in a digit product, so the whole `1…` range is skipped).
 *  - {@link HugeIntEx#countTwoComponents} / {@link HugeIntEx#countTwoComponentsNoFirstCell}
 *    — the "twos in the digit product" vocabulary used by the base-12/24
 *    accommodate rules; thin wrappers over {@link HugeInt#factorCountOf}.
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

    /**
     * @param {BigInt} [initValue=0n]
     * @param {BigInt} [base=10n]
     * @param {() => DigitCell} [digitCellFactory=defaultDigitCellFactory]
     */
    constructor(initValue = 0n, base = 10n, digitCellFactory = defaultDigitCellFactory) {
        super(initValue, base, digitCellFactory)
        this.#digitCellFactory = digitCellFactory
    }

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
     *   is skipped (a leading 1 is inert in a digit product).
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
}

export default HugeIntEx
