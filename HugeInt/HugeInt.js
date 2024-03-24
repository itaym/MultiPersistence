import { digitsObj as baseDigits, digitsValue, toNumber, toBigInt } from '../Digits/index.js'

/**
 * @typedef DigitCell
 * @property {boolean} changed
 * @property {bigint} count
 * @property {toBigInt} digit
 * @property {bigint} result
 */

/**
 * @class HugeInt
 */
class HugeInt {

    /**
     *
     * @param {bigint} initValue
     * @param {bigint} base
     */
    constructor(initValue = 0n, base = 10n) {
        this.#base = base
        this.#baseMinusOne = this.#base - 1n
        this.cellsArr = []
        this.startIndex = 0

        if (initValue === 0n) {
            this.cellsArr.push({
                changed: true,
                count: 1n,
                digit: 0n,
                result: 0n,
            })
        } else {
            const digit = initValue % base
            initValue /= base
            let currentCell = {
                changed: true,
                count: 1n,
                digit,
                result: 0n,
            }
            while (initValue !== 0n) {
                const digit = initValue % base
                initValue /= base
                if (currentCell.digit === digit) {
                    currentCell.count++
                } else {
                    this.cellsArr.push(currentCell)
                    currentCell = {
                        changed: true,
                        count: 1n,
                        digit,
                        result: 0n,
                    }
                }
            }
            this.cellsArr.push(currentCell)
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
        if ((this.cellsArr.length - 2) < this.startIndex) return undefined
        return this.cellsArr[this.cellsArr.length - 2]
    }

    /**
     *
     * @readonly
     * @property {number} cellsLength
     */
    get cellsLength() {
        return this.cellsArr.length - this.startIndex
    }

    /**
     *
     * @readonly
     * @property {DigitCell} firstCell
     */
    get firstCell() {
        return this.cellsArr[this.startIndex]
    }

    /**
     *
     * @readonly
     * @property {DigitCell} lastCell
     */
    get lastCell() {
        return this.cellsArr[this.cellsArr.length - 1]
    }

    /**
     *
     * @readonly
     * @property {bigint} length
     */
    get length() {
        let length = 0n
        for (let index = this.startIndex; index < this.cellsArr.length; index++) {
            length += this.cellsArr[index].count
        }
        return length
    }

    /**
     *
     * @readonly
     * @property {DigitCell} secondCell
     */
    get secondCell() {
        return this.cellsArr[this.startIndex + 1]
    }

    /**
     *
     * @readonly
     * @property {DigitCell} value
     */
    get value() {
        let value = 0n
        let power = 0n
        let base = this.#base

        for (let cellIndex = this.startIndex; cellIndex < this.cellsArr.length; cellIndex++) {
            let cell = this.cellsArr[cellIndex]
            const digit = cell.digit
            for (let x = 0; x < cell.count; x++) {
                value += digit * (base ** power)
                power++
            }
        }
        return value
    }

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@METHODS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */

    /**
     * @method addCellAfter
     * @param {number} index
     * @param {DigitCell} cell
     * @return {DigitCell[]}
     */
    addCellAfter(index, cell) {
        return this.cellsArr.splice(index + 1, 0, cell)
    }

    /**
     * @method addCellBefore
     * @param {number} index
     * @param {DigitCell} cell
     * @return {DigitCell[]}
     */
    addCellBefore(index, cell) {
        if (index === -1) {
            this.cellsArr.unshift(cell)
            return []
        }
        return this.cellsArr.splice(index, 0, cell)
    }

    /**
     * @method initStartIndex
     */
    initStartIndex() {
        this.cellsArr = this.cellsArr.slice(this.startIndex)
        this.startIndex = 0
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
        this.startIndex = 0
        this.cellsArr = Array(digitsArr.length)

         for (let index = digitsArr.length - 1, x = 0; index > -1; index--, x++) {
            const digits = digitsArr[index]
            this.cellsArr[x] = {
                changed: true,
                count: toBigInt[digits.length],
                digit: digitsValue[digits[0]],
                result: 0n,
            }
        }

    }

    addOne(cellIndex) {
        let cell = this.cellsArr[cellIndex + this.startIndex]
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }
            this.addCellAfter(cellIndex + this.startIndex, {
                changed: true,
                count: cell.count - 1n,
                digit: cell.digit,
                result: 0n,
            })
            cell.count = 1n
            cell.digit++
            return
        }

        cell.digit = 0n

        if (cellIndex && this.cellsArr[cellIndex + this.startIndex - 1].digit === 0n) {
            this.cellsArr[cellIndex + this.startIndex - 1].count += cell.count
            this.cellsArr.splice(cellIndex + this.startIndex, 1)
            cellIndex--
        }
        if (cellIndex + this.startIndex === this.cellsArr.length - 1) {
            this.cellsArr.push({
                changed: true,
                count: 1n,
                digit: 2n, // 1n
                result: 0n,
            })
            return
        }
        this.addOne(cellIndex + 1)
    }
    addOneToSorted(cellIndex) {
        let cell = this.cellsArr[cellIndex + this.startIndex]
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }
            this.addCellAfter(cellIndex + this.startIndex, {
                changed: true,
                count: cell.count - 1n,
                digit: cell.digit,
                result: 0n,
            })
            cell.count = 1n
            cell.digit++
            return
        }

        cell.digit = 0n

        if (cellIndex + this.startIndex === this.cellsArr.length - 1) {
            this.cellsArr.push({
                changed: true,
                count: 1n,
                digit: 2n, // 1n
                result: 0n,
            })
            return
        }
        this.addOneToSorted(cellIndex + 1)
    }

    subtractOne(cellRelativeToStartIndex) {
        const cellIndex = cellRelativeToStartIndex + this.startIndex
        let cell = this.cellsArr[cellIndex]

        if (cell.digit !== 0n) {
            if (cell.count === 1n) {
                cell.digit--
                return
            } else {
                this.addCellAfter(cellIndex, {
                    changed: true,
                    count: cell.count - 1n,
                    digit: cell.digit,
                    result: 0n,
                })
                cell.count = 1n
                cell.digit--
                return
            }
        }

        cell.digit = this.#baseMinusOne
        // if (cellIndex && this.cellsArr[cellIndex - 1].digit === 0n) {
        //     this.cellsArr[cellIndex - 1].count += cell.count
        //     this.cellsArr.splice(cellIndex, 1)
        //     cellIndex--
        // }
        if (cellIndex === this.cellsArr.length - 1) {
            cell.digit = 0n
            // this.cellsArr.push({
            //     count: 1n,
            //     digit: 2n // 1n
            // })
            return
        }
        this.subtractOne(cellIndex + 1 - this.startIndex)
        // if (cellIndex && (this.cellsArr[cellIndex - 1].digit === cell.digit)) {
        //     console.log('sdf')
        //     this.cellsArr[cellIndex - 1].count += cell.count
        //     this.cellsArr.splice(cellIndex, 1)
        // }
        // if (cellIndex < (this.cellsLength - 1) && (this.cellsArr[cellIndex + 1].digit === cell.digit)) {
        //     console.log('sdf')
        //     this.cellsArr[cellIndex].count += this.cellsArr[cellIndex + 1].count
        //     this.cellsArr.splice(cellIndex + 1, 1)
        // }
    }

    isGTBase() {
        return (!(this.cellsArr.length - this.startIndex === 1 && this.cellsArr[this.startIndex].count === 1n))
    }

    includes(digit) {
        for (let cell of this.cellsArr) {
            if (cell.digit === digit) return cell.count
        }
        return 0
    }

    includesCellOf(digit) {
        for (let x = this.startIndex; x < this.cellsArr.length; x++)
            if (this.cellsArr[x].digit === digit) return [this.cellsArr[x], x]
        return [null, -1]
    }


    getCellOf(digit) {
        for (let cellIndex = this.startIndex; cellIndex < this.cellsArr.length; cellIndex++) {
            if (this.cellsArr[cellIndex].digit === digit) return this.cellsArr[cellIndex]
        }
        return null
    }

    isCellOf(digit) {
        for (let cellIndex = this.startIndex; cellIndex < this.cellsArr.length; cellIndex++) {
            if (this.cellsArr[cellIndex].digit === digit) return true
        }
        return false
    }

    isLTBase() {
        return this.cellsArr.length === (1 + this.startIndex) && this.cellsArr[this.startIndex].count === 1n
    }

    moduloBase() {
        return this.cellsArr[this.startIndex].digit
    }

    hasEvenDigits() {
        for (let cellIndex = this.startIndex; cellIndex < this.cellsArr.length; cellIndex++) {
            if ((this.cellsArr[cellIndex].digit % 2n) === 0n) {
                return true
            }
        }
        return false
    }

    countTwoComponents() {
        let count = 0
        for (let cellIndex = this.startIndex; cellIndex < this.cellsArr.length; cellIndex++) {
            let log2 = Math.log2(toNumber[this.cellsArr[cellIndex].digit])
            if (log2 === Math.floor(log2)) {
                count += log2 * toNumber[this.cellsArr[cellIndex].count]
            }
        }
        return count
    }

    countTwoComponentsNoFirstCell() {
        let count = 0
        for (let cellIndex = this.startIndex + 1; cellIndex < this.cellsArr.length; cellIndex++) {
            let log2 = Math.log2(toNumber[this.cellsArr[cellIndex].digit])
            if (log2 === Math.floor(log2)) {
                count += log2 * toNumber[this.cellsArr[cellIndex].count]
            }
        }
        return count
    }

    multiplyBy(hugeInt) {
        return new HugeInt(this.value * hugeInt.value, this.#base)
    }

    multiplyByBasePower(count) {
        if (this.cellsArr[this.startIndex].digit === 0n) {
            this.cellsArr[this.startIndex].count += count
            this.cellsArr[this.startIndex].changed = true
        } else if (this.startIndex !== 0) {
            this.startIndex--
            this.cellsArr[this.startIndex] = {
                changed: true,
                count,
                digit: 0n,
                result: 0n
            }
        } else {
            this.cellsArr.unshift({
                changed: true,
                count,
                digit: 0n,
                result: 0n
            })
        }
    }

    combineCells = function (startIndex = this.startIndex, endIndex = this.cellsArr.length - 1) {
        if (this.cellsArr.length === 1) return

        for (let cellIndex = this.startIndex; cellIndex < endIndex; cellIndex++) {
            const currentCell = this.cellsArr[cellIndex]
            currentCell.changed = true
            let nextCell = this.cellsArr[cellIndex + 1]

            if (currentCell.count === 0n) currentCell.digit = nextCell.digit
            let deleteCount = 0

            while (nextCell && (nextCell.digit === currentCell.digit)) {
                currentCell.count += nextCell.count
                deleteCount++
                nextCell = this.cellsArr[cellIndex + deleteCount + 1]
            }

            if (deleteCount !== 0) {
                this.cellsArr.splice(cellIndex, deleteCount + 1, currentCell)
            }
        }
    }

    splitCellAfter(cell, countToSplit) {
        let index = this.cellsArr.indexOf(cell)
        if (index < this.startIndex) return

        const newCell = {changed: true, count: cell.count - countToSplit, digit: cell.digit, result: 0n}
        this.addCellAfter(index, newCell)
        cell.count = countToSplit
        cell.changed = true
    }

    splitCellBefore(cell, countToSplit) {
        let index = this.cellsArr.indexOf(cell)
        if (index < this.startIndex) return

        const newCell = {changed: true, count: countToSplit, digit: cell.digit, result: 0n}
        this.addCellBefore(index, newCell)
        cell.count = cell.count - countToSplit
        cell.changed = true
        return newCell
    }

    cellPosition(cell) {
        let position = 0n
        for (let currentCell of this.cellsArr) {
            if (currentCell === cell) break
            position += currentCell.count
        }
        return position
    }

    cellIndex(cell) {
        for (const [index, currentCell] of this.cellsArr.entries()) {
            if (currentCell === cell) return index
        }
        return -1
    }

    getCellByIndex(index) {
        return this.cellsArr[index]
    }

    sort() {
        const groups = this.cellsArr.group(number => number.digit)
        // this.cellsArr.sort((a, b) =>
        //     Number(a.digit - b.digit)
        // )
        const tmpArr = Object.values(groups).flat()
        const newArr = []
        tmpArr.sort((a, b) => Number(b.digit - a.digit))
        let currentNumber = {changed: true, count: 0n, digit: 0n, result: 0n}

        for (let number of tmpArr) {
            if (number.digit === currentNumber.digit) {
                currentNumber.count += number.count
            } else {
                if (currentNumber.count !== 0n) {
                    newArr.push(currentNumber)
                }
                currentNumber = {...number}
            }
        }
        if (currentNumber.count !== 0) {
            newArr.push(currentNumber)
        }
        this.cellsArr = newArr
    }

    contains(digit) {
        for (let cell of this.cellsArr) {
            if (baseDigits.get(cell.digit) === digit) {
                return true
            }
        }
        return false
    }

    /**
     * @method toString
     * @return {string}
     */
    toString() {
        let tmpStr = ''
        for (let cellIndex = this.startIndex; cellIndex < this.cellsArr.length; cellIndex++) {
            let cell = this.cellsArr[cellIndex]
            tmpStr = baseDigits.get(cell.digit).repeat(Number(cell.count)) + tmpStr
        }
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

    [Symbol.iterator]() {
        return this.cellsArr[Symbol.iterator]()
    }
}
export default HugeInt //546
