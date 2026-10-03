import {
    defaultDigitCellFactory,
    HugeInt,
} from '#HugeInt/HugeInt.js'

/** {@link HugeInt} for the search: cached length and a fast "next number with non-decreasing digits" step. */
export class HugeIntEx extends HugeInt {
    /**
     * @param {bigint} [base=10n]
     * @param {() => DigitCell} [digitCellFactory=defaultDigitCellFactory]
     * @param {bigint|number} [initValue=0n]
     */
    constructor(base = 10n, digitCellFactory = defaultDigitCellFactory, initValue = 0n) {
        super(base, digitCellFactory, initValue)

        this.#base = base
        this.#baseMinusOne = this.#base - 1n
        this.#digitCellFactory = digitCellFactory
        this.#length = super.length
    }

    /** @type {bigint} */
    #base
    /** @type {bigint} `base - 1n` */
    #baseMinusOne
    /** @type {() => DigitCell} */
    #digitCellFactory
    /** @type {bigint} cached digit count */
    #length = 0n

    /** @returns {bigint} digit count */
    get length() {
        return this.#length
    }

    /**
     * Steps to the next number whose digits are non-decreasing and at least 2, in place.
     *
     * @param {DigitCell} [cell=this.firstCell] cell to increment
     * @returns {void}
     */
    addOneToSorted(cell = this.firstCell) {
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }
            const cellToAdd = this.#digitCellFactory()

            this.addCellBefore(cellToAdd, cell)
            cellToAdd.digit = cell.digit + 1n
            cell.count--
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
     * Factors of 2 in the digit product from `cell` up.
     *
     * @param {DigitCell} [cell=this.firstCell]
     * @returns {number}
     */
    countTwoComponents(cell) {
        return Number(this.factorCountOf(2n, cell ?? this.firstCell))
    }

    /**
     * Factors of 2 in the digit product, first cell excluded.
     *
     * @returns {number}
     */
    countTwoComponentsNoFirstCell() {
        return this.countTwoComponents(this.firstCell.next)
    }

    /**
     * Digits, most significant first, one entry per cell.
     *
     * @returns {bigint[]}
     */
    getDigits() {
        const digits = []
        for (let cell = this.lastCell; cell; cell = cell.prev) digits.push(cell.digit)
        return digits
    }

    /**
     * @param {HugeInt|bigint|number} other
     * @returns {this}
     */
    add(other) {
        const r = super.add(other)
        this.#length = super.length
        return r
    }

    /**
     * @param {DigitCell} [cell]
     * @returns {void}
     */
    addOne(cell) {
        super.addOne(cell)
        this.#length = super.length
    }

    /**
     * Compares with a same-base number.
     *
     * @param {HugeIntEx} other
     * @returns {-1|0|1}
     */
    compare(other) {
        // In this case the base will always be the same, so saving the check
        // if (this.base !== other.base) throw new Error('Both HugeIntExs must be from the same base')
        if (this.length !== other.length) return this.length < other.length ? -1 : 1

        let thisCell = this.lastCell
        let otherCell = other.lastCell

        while (thisCell) {
            if (thisCell.digit !== otherCell.digit) return thisCell.digit < otherCell.digit ? -1 : 1

            if (thisCell.count === otherCell.count) {
                thisCell = thisCell.prev
                otherCell = otherCell.prev
            } else return thisCell.count < otherCell.count ? 1 : -1
        }
        return 0
    }

    /**
     * @param {bigint} base
     * @param {string} str
     * @returns {this}
     */
    fromString(base, str) {
        super.fromString(base, str)
        this.#length = super.length
        return this
    }

    /**
     * @param {HugeInt|bigint|number} other
     * @param {MultiplyOptions} [options]
     * @returns {this}
     */
    multiply(other, options) {
        const r = super.multiply(other, options)
        this.#length = super.length
        return r
    }

    /**
     * @param {bigint} digit
     * @returns {this}
     */
    multiplyByDigit(digit) {
        const r = super.multiplyByDigit(digit)
        this.#length = super.length
        return r
    }

    /**
     * @param {bigint} k
     * @returns {this}
     */
    shiftLeft(k) {
        const r = super.shiftLeft(k)
        this.#length = super.length
        return r
    }

    /**
     * @param {DigitCell} [cell]
     * @returns {void}
     */
    subtractOne(cell) {
        super.subtractOne(cell)
        this.#length = super.length
    }
}

export default HugeIntEx
