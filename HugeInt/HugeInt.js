import {
    digitsObj as baseDigits,
    digitsValue,
    toBigInt,
} from '#Digits/index.js'
import {
    addGroups,
    bigIntToGroups,
    BudgetExceededError,
    groupsToBigInt,
    multiplyGroups,
    multiplyGroupsByDigit,
} from './multiply.js'
import testDigitCellFactory from './utils.js'

/**
 * Fresh digit cell: digit 0, run length 1, unlinked.
 *
 * @returns {DigitCell}
 */
export const defaultDigitCellFactory = () => ({
    changed: true,
    count: 1n,
    digit: 0n,
    next: null,
    prev: null,
})

/** Arbitrary-size non-negative integer stored as a doubly linked list of digit runs, the least significant first. */
export class HugeInt {
    /**
     * @param {bigint} [base=10n]
     * @param {() => DigitCell} [digitCellFactory=defaultDigitCellFactory] must return a valid fresh {@link DigitCell}
     * @param {bigint} [initValue=0n]
     */
    constructor(base = 10n, digitCellFactory = defaultDigitCellFactory, initValue = 0n) {
        this.#base = base
        this.#baseMinusOne = this.#base - 1n
        this.#digitCellFactory = digitCellFactory

        if (!testDigitCellFactory(this.#digitCellFactory)) {
            throw new Error('digitCellFactory function must return a valid DigitCell object')
        }

        let currentValue = initValue

        if (currentValue === 0n) {
            this.firstCell = this.#digitCellFactory()
            this.lastCell = this.firstCell
        } else {
            let digit = initValue % base
            currentValue /= base
            let currentCell = this.#digitCellFactory()
            currentCell.digit = digit
            this.firstCell = currentCell
            while (currentValue !== 0n) {
                digit = currentValue % base
                currentValue /= base
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

    /** @type {bigint} */
    #base
    /** @type {bigint} `base - 1n` */
    #baseMinusOne
    /** @type {() => DigitCell} */
    #digitCellFactory

    /** @type {DigitCell} least significant cell */
    firstCell

    /** @type {DigitCell} most significant cell */
    lastCell

    /**
     * @param {...bigint} args
     * @returns {bigint}
     */
    static maxBigInt = (...args) => args.reduce((a, b) => (a > b ? a : b))

    /** @type {bigint} approximate BigInt size limit, in bits */
    static maxBigIntBits = 1n << 30n
    /**
     * @param {...bigint} args
     * @returns {bigint}
     */
    static minBigInt = (...args) => args.reduce((a, b) => (a < b ? a : b))

    /** @returns {bigint} */
    get base() {
        return this.#base
    }

    /** @returns {DigitCell|null} cell before the most significant one */
    get beforeLastCell() {
        return this.lastCell.prev
    }

    /** @returns {number} number of cells */
    get cellsLength() {
        let count = 0
        let cell = this.firstCell
        while (cell) {
            count++
            cell = cell.next
        }
        return count
    }

    /** @returns {bigint} digit count */
    get length() {
        let count = 0n
        let cell = this.firstCell
        while (cell) {
            count += cell.count
            cell = cell.next
        }
        return count
    }

    /** @returns {DigitCell|null} */
    get secondCell() {
        return this.firstCell.next
    }

    /** @returns {bigint} */
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
     * Links `cell` right after (more significant than) `currentCell`.
     *
     * @param {DigitCell} cell
     * @param {DigitCell} currentCell
     * @returns {DigitCell} `cell`
     */
    addCellAfter(cell, currentCell) {
        currentCell.next && (currentCell.next.prev = cell)

        cell.next = currentCell.next
        currentCell.next = cell
        cell.prev = currentCell

        !cell.next && (this.lastCell = cell)

        return cell
    }

    /**
     * Links `cell` right before (less significant than) `currentCell`.
     *
     * @param {DigitCell} cell
     * @param {DigitCell} currentCell
     * @returns {DigitCell} `cell`
     */
    addCellBefore(cell, currentCell) {
        currentCell.prev && (currentCell.prev.next = cell)
        cell.prev = currentCell.prev
        currentCell.prev = cell
        cell.next = currentCell

        !cell.prev && (this.firstCell = cell)

        return cell
    }

    /**
     * Replaces the value with `str` read in `base`; runs longer than 9999 are not supported.
     *
     * @param {bigint} base
     * @param {string} str
     * @returns {this}
     */
    fromString(base, str) {
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

    /** @returns {boolean} */
    isZero() {
        return !this.firstCell.next && this.firstCell.digit === 0n
    }

    /**
     * Cells as `[digit, count]` groups, least significant first.
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
     * Replaces the cells with `groups`, merging equal neighbours and trimming leading zeros.
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
     * `other` as digit groups in this base.
     *
     * @param {HugeInt|bigint|number} other
     * @returns {DigitGroups}
     */
    #coerceToGroups(other) {
        if (other instanceof HugeInt) {
            if (other.#base !== this.#base) throw new Error('Base is incompatible.')
            return other.#toGroups()
        }
        if (typeof other === 'bigint') return bigIntToGroups(this.#base, other)
        if (typeof other === 'number') {
            if (!Number.isInteger(other)) throw new RangeError('HugeInt: expected an integer')
            return bigIntToGroups(this.#base, BigInt(other))
        }
        throw new TypeError('HugeInt: expected a HugeInt, bigint, or integer')
    }

    /**
     * Whether the value, grown by `extraDigits`, stays under {@link HugeInt.maxBigIntBits}.
     *
     * @param {bigint} [extraDigits=0n]
     * @returns {boolean}
     */
    #fitsBigInt(extraDigits = 0n) {
        const bitsPerDigit = BigInt(Math.ceil(Math.log2(Number(this.#base))) || 1)
        return (this.length + extraDigits) * bitsPerDigit < HugeInt.maxBigIntBits
    }

    /**
     * @param {[bigint|number, bigint|number][]} groups `[digit, count]`, least significant first
     * @param {bigint} [base=10n]
     * @returns {HugeInt}
     */
    static fromGroups(groups, base = 10n) {
        const hugeInt = new HugeInt(base, undefined, 0n)
        return hugeInt.#groupsToDigitCells(groups.map(([digit, count]) => [BigInt(digit), BigInt(count)]))
    }

    /**
     * Adds `other` in place.
     *
     * @param {HugeInt|bigint|number} other
     * @returns {this}
     */
    add(other) {
        return this.#groupsToDigitCells(addGroups(this.#base, this.#toGroups(), this.#coerceToGroups(other)))
    }

    /**
     * Multiplies by a single digit in place.
     *
     * @param {bigint} digit in `[0, base]`
     * @returns {this}
     */
    multiplyByDigit(digit) {
        if (typeof digit !== 'bigint' || digit < 0n || digit >= this.#base) {
            throw new RangeError('HugeInt.multiplyByDigit: expected a bigint digit in [0, base]')
        }
        return this.#groupsToDigitCells(multiplyGroupsByDigit(this.#base, digit, this.#toGroups()))
    }

    /**
     * Multiplies by `base ** k` in place.
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
        this.addCellBefore(cell, this.firstCell)
        return this
    }

    /**
     * Multiplies by `other` in place, via BigInt when small enough, else on digit groups.
     *
     * @param {HugeInt|bigint|number} other
     * @param {MultiplyOptions} [options]
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
                return this.#groupsToDigitCells(
                    bigIntToGroups(this.#base, this.value * groupsToBigInt(this.#base, otherGroups)),
                )
            } catch (err) {
                if (err.name !== 'RangeError') throw err
            }
        }
        return this.#groupsToDigitCells(multiplyGroups(this.#base, this.#toGroups(), otherGroups, options))
    }

    /**
     * Adds one at `cell`, in place.
     *
     * @param {DigitCell} [cell=this.firstCell]
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
            this.addCellAfter(cellToAdd, cell)
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
            this.addCellAfter(cellToAdd, cell)
            return
        }
        this.addOne(cell.next)
    }

    /**
     * Unlinks `cell`.
     *
     * @param {DigitCell} cell
     * @returns {void}
     */
    removeCell(cell) {
        if (cell.prev) {
            cell.prev.next = cell.next
        } else {
            this.firstCell = cell.next
        }
        if (cell.next) {
            cell.next.prev = cell.prev
        } else {
            this.lastCell = cell.prev
        }
    }

    /**
     * Subtracts one at `cell`, in place.
     *
     * @param {DigitCell} [cell=this.firstCell]
     * @returns {void}
     */
    subtractOne(cell) {
        cell ??= this.firstCell
        let cellToAdd

        if (cell.digit !== 0n) {
            if (cell.count === 1n) {
                cell.digit--
                return
            }
            cellToAdd = this.#digitCellFactory()
            cellToAdd.count = cell.count - 1n
            cellToAdd.digit = cell.digit

            this.addCellAfter(cellToAdd, cell)
            cell.count = 1n
            cell.digit--
            return
        }

        cell.digit = this.#baseMinusOne

        if (cell === this.lastCell) {
            cell.count = 1n
            cell.digit = 0n
            return
        }
        this.subtractOne(cell.next)
    }

    /** @returns {boolean|DigitCell} truthy when the value is at least `base` */
    isGTBase() {
        return this.firstCell.count > 1n || this.firstCell.next
    }

    /**
     * How many times `digit` occurs.
     *
     * @param {bigint} digit
     * @returns {bigint}
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
     * First cell holding `digit`.
     *
     * @param {bigint} digit
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
     * @param {bigint} digit
     * @returns {boolean} whether `digit` occurs
     */
    isCellOf(digit) {
        let cell = this.firstCell
        do {
            if (cell.digit === digit) return true
            cell = cell.next
        } while (cell)
        return false
    }

    /** @returns {boolean} whether the value is below `base` */
    isLTBase() {
        return (!this.firstCell.next) && this.firstCell.count === 1n
    }

    /** @returns {bigint} value mod `base` */
    moduloBase() {
        return this.firstCell.digit
    }

    /** @returns {boolean} whether any digit is even */
    hasEvenDigits() {
        let cell = this.firstCell
        while (cell) {
            if ((cell.digit % 2n) === 0n) return true
            cell = cell.next
        }
        return false
    }

    /**
     * Factors of `factor` in the digit product from `cell` up.
     *
     * @param {bigint} factor
     * @param {DigitCell} [cell=this.firstCell]
     * @returns {bigint}
     */
    factorCountOf(factor, cell = this.firstCell) {
        let total = 0n

        while (cell) {
            let count = 0n
            let { digit } = cell
            while (digit !== 0n && digit % factor === 0n) {
                digit /= factor
                count++
            }
            total += count * cell.count
            cell = cell.next
        }

        return total
    }

    /**
     * Splits `cell` so it keeps `countToSplit` digits and a new more-significant cell takes the rest.
     *
     * @param {DigitCell} cell
     * @param {bigint} countToSplit
     * @returns {DigitCell} the new cell
     */
    splitCellAfter(cell, countToSplit) {
        const newCell = this.#digitCellFactory()
        newCell.count = cell.count - countToSplit
        newCell.digit = cell.digit

        this.addCellAfter(newCell, cell)
        cell.count = countToSplit
        cell.changed = true
        return newCell
    }

    /**
     * Splits `countToSplit` digits of `cell` into a new less-significant cell.
     *
     * @param {DigitCell} cell
     * @param {bigint} countToSplit
     * @returns {DigitCell} the new cell
     */
    splitCellBefore(cell, countToSplit) {
        const newCell = this.#digitCellFactory()
        newCell.count = countToSplit
        newCell.digit = cell.digit

        this.addCellBefore(newCell, cell)
        cell.count -= countToSplit
        cell.changed = true
        return newCell
    }

    /** @returns {string} digits in `base`, most significant first */
    toString() {
        let tmpStr = ''
        let cell = this.lastCell

        do {
            tmpStr += baseDigits.get(cell.digit).repeat(Number(cell.count))
            cell = cell.prev
        } while (cell)

        return tmpStr
    }

    /** @returns {string} {@link toString} with a comma every three digits */
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

    /** @returns {Generator<DigitCell|null>} cells, the least significant first */
    * [Symbol.iterator]() {
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
