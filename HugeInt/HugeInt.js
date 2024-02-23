import { digitsObj as baseDigits, digitsValue } from '../Digits/index.js'
/**
 * type bigint
 */
const bigint =0n
/**
 * @typedef {Object} DigitCell
 * @property count {bigint}
 * @property digit {bigint}
 */
if (!Array.prototype.group) {
    Array.prototype.group = function(callback) {
        const result = {}
        this.forEach((item, index, array) => {
            const group = callback(item, index, array)
            if (!result[group]) result[group] = []
            result[group].push(item)
        })
        return result
    }
}

function toString(constructor) {
    const nativeToString = constructor.prototype.toString
    constructor.prototype.toString = function (radix = 10n) {
        if (radix <= 16) {
            return nativeToString.call(this, Number(radix))
        } else {
            let initBigInt
            initBigInt = BigInt(this)
            if (initBigInt === 0n) {
                return '0'
            } else {
                const bigIntBase = BigInt(radix)
                let result = []
                while (initBigInt !== 0n) {
                    const digit = Number(initBigInt % bigIntBase)
                    //if (digit === 0) return '0'
                    result.unshift(baseDigits[digit])
                    initBigInt /= bigIntBase
                }
                return result.join('')
            }
        }
    }
}
toString(String)
toString(BigInt)
toString(Object)

const addCellAfter = function(index, cell) {
    this.cellsArr.splice(index + 1, 0, cell)
}
const addCellBefore = function(index, cell) {
    if (index === -1) {
        this.cellsArr.unshift(cell)
        return
    }
    this.cellsArr.splice(index, 0, cell)
}

/**
 *
 * @type {DigitCell}
 */
export const DigitCell = class {
    count = 0n
    digit = 0n
}

class HugeInt {
    /**
     *
     * @param initBigInt
     * @param base { number | bigint | string }
     */
    constructor(initBigInt = 0n, base = 10) {

        this.base = BigInt(Number(base))
        this.baseMinusOne = this.base - 1n
        this.cellsArr = []
        initBigInt = BigInt(initBigInt)
        // const digitsArr = initBigInt.toString(base).match(/((.)\2*)/g).reverse()
        //
        // for (let digits of digitsArr) {
        //     this.cellsArr.push({ count: digits.length, digit: digitsValue[digits[0]]})
        // }

        if (initBigInt === 0n) {
            this.cellsArr.push({
                count: 1n,
                digit: 0n
            })
        }
        else {
            const bigIntBase = BigInt(base)
            const digit = initBigInt % bigIntBase
            initBigInt /= bigIntBase
            let currentCell = {count: 1n, digit}
            while (initBigInt !== 0n) {
                const digit = initBigInt % bigIntBase
                initBigInt /= bigIntBase
                if (currentCell.digit === digit) {
                    currentCell.count++
                } else {
                    this.cellsArr.push(currentCell)
                    currentCell = {
                        count: 1n,
                        digit,
                    }
                }
            }
            this.cellsArr.push(currentCell)
        }

        this._addCellAfter = addCellAfter.bind(this)
        this._addCellBefore = addCellBefore.bind(this)
    }
    get length() {
        return this.cellsArr.reduce((a, b) => b.count + a, 0n)
    }
    get cellsLength() {
        return this.cellsArr.length
    }
    get secondCell() {
        return this.cellsArr[1]
    }
    get firstCell() {
        return this.cellsArr[0]
    }
    get beforeLastCell() {
        return this.cellsArr[this.cellsLength - 2]
    }
    get lastCell() {
        return this.cellsArr[this.cellsLength - 1]
    }
    get value() {
        let value = 0n
        let power = 0n
        let base = this.base

        this.cellsArr.forEach(cell => {
            const digit = cell.digit
            for (let x = 0; x < cell.count; x++) {
                value += digit * (base ** power)
                power++
            }
        })
        return value
    }
    createSorted(value, base) {
        this.base = BigInt(base)
        this.baseMinusOne = this.base - 1n
        const cache = {}

        do {
            const digit = value % base || base
            value /= base
            if (!cache[digit])
                cache[digit] = { count: 1n, digit }
            else
                cache[digit].count++
        } while (value !== 0n)
        this.cellsArr = Object.values(cache)
        this.cellsArr.sort((aCell, bCell) => {
            // if (aCell.digit === 0n) aCell.digit = base
            // if (bCell.digit === 0n) bCell.digit = base

            return Number(bCell.digit - aCell.digit)
        })
        if (this.cellsArr[0].digit === base) this.cellsArr[0].digit = 0n
    }
    fromString(str, base = 10) {
        this.cellsArr = []
        try {
            const digitsArr = (str.match(/((.)\2*)/g) || [str]).reverse()

            for (let digits of digitsArr) {
                this.cellsArr.push({count: BigInt(digits.length), digit: digitsValue[digits[0]]})
            }
        }
        catch (e) {
            debugger
        }
        this.base = BigInt(base)
        this.baseMinusOne = this.base - 1n

    }
    clone() {
        const newHugeInt = new HugeInt(0n, this.base)
        newHugeInt.cellsArr = this.cellsArr.map(cell => ({...cell}))
        return newHugeInt
    }
    digitAt(digitIndex) {
        let cellIndex = 0
        digitIndex = Math.min(digitIndex, this.length)
        let count = this.cellsArr[cellIndex].count
        while (count - 1n < digitIndex) {
            cellIndex++
            count += this.cellsArr[cellIndex].count
        }
        return this.cellsArr[cellIndex].digit
    }
    addOne(cellIndex) {
        let cell = this.cellsArr[cellIndex]

        if (cell.digit !== this.baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            } else {
                this._addCellAfter(cellIndex, {
                    count: cell.count - 1n,
                    digit: cell.digit,
                })
                cell.count = 1n
                cell.digit++
                return
            }
        }

        cell.digit = 0n

        // if (cellIndex && this.cellsArr[cellIndex - 1].digit === 0n) {
        //     this.cellsArr[cellIndex - 1].count += cell.count
        //     this.cellsArr.splice(cellIndex, 1)
        //     cellIndex--
        // }
        if (cellIndex === this.cellsLength - 1) {
            this.cellsArr.push({
                count: 1n,
                digit: 2n // 1n
            })
            return
        }
        this.addOne(cellIndex + 1)
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
    addBasePower(numOfZeros) {
        if (numOfZeros === 0) {
            return this.addOne()
        }
        let cellIndex = 0

        while (this.cellsArr[cellIndex].count <= numOfZeros) {
            numOfZeros -= this.cellsArr[cellIndex].count
            cellIndex++
            if (cellIndex === this.cellsLength) break
        }
        if (cellIndex === this.cellsLength) {
            if (numOfZeros > 0) {
                this.cellsArr.push({
                    count: numOfZeros,
                    digit: 0n
                })
            }
            this.cellsArr.push({
                count: 1n,
                digit: 1n
            })
        }
        else {
            if (this.cellsArr[cellIndex].count === 1n) {
                this.addOne(cellIndex)
                return
            }
            if (numOfZeros > 0) {
                this._addCellBefore(cellIndex, {
                    count: BigInt(numOfZeros),
                    digit: this.cellsArr[cellIndex].digit
                })
                cellIndex++
                this.cellsArr[cellIndex].count -= BigInt(numOfZeros)
            }
            if (this.cellsArr[cellIndex].count > 1n) {
                this._addCellAfter(cellIndex, {
                    count: this.cellsArr[cellIndex].count - 1n,
                    digit: this.cellsArr[cellIndex].digit
                })
                this.cellsArr[cellIndex].count = 1n
            }
            this.addOne(cellIndex)
        }
    }

    divideBy10power(count) {
        while (count) {
            const lastCell = this.cellsArr[this.cellsArr.length - 1]
            if (lastCell.count >= count) {
                lastCell.count -= count
                count = 0
            } else {
                count -= lastCell.count
                this.cellsArr.pop()
            }
        }
    }
    isGTBase() {
        return (!(this.cellsLength === 1 && this.cellsArr[0].count === 1n))
    }
    isGT(hugeInt) {
        if (this.length > hugeInt.length) {
            return true
        }
        if (this.length < hugeInt.length) {
            return false
        }
        for (let cellIndex = this.cellsLength - 1; cellIndex >= 0; cellIndex--) {
            const thisCell = this.cellsArr[cellIndex]
            const hugeIntCell = hugeInt.cellsArr[cellIndex]

            if (thisCell.digit > hugeIntCell.digit) {
                return true
            }
            if (thisCell.digit < hugeIntCell.digit) {
                return false
            }
            if (thisCell.count > hugeIntCell.count) {
                return true
            }
            if (thisCell.count < hugeIntCell.count) {
                return false
            }
        }
        return false
    }
    isDigitAtIndex(index, digit) {
        return this.cellsArr[index].digit === digit
    }
    includes(digit) {
        for (let cell of this.cellsArr) {
            if (cell.digit === digit) return cell.count
        }
        return 0
    }

    /**
     *
     * @param digit {bigint}
     * @returns {(DigitCell|null, number)[]|number[]}
     */
    includesCellOf(digit) {
        for (const [index, cell] of this.cellsArr.entries()) {
            if (cell.digit === digit) return [cell, index]
        }
        return [null, -1]
    }
    includesCellOf2(digit) {
        for (let x = this.cellsArr.length - 1; x > -1; x--)
            if (this.cellsArr[x].digit === digit) return [this.cellsArr[x], x]
        return [null, -1]
    }
    includesCellAtIndex0Of(digit) {
        if (this.cellsArr[0].digit === digit) {
            return [this.cellsArr[0], 0]
        }
        return [null, -1]
    }
    getCellOf(digit) {
        for (let cell of this.cellsArr) {
            if (cell.digit === digit) return cell
        }
        return null
    }
    isCellOf(digit) {
        for (let cell of this.cellsArr) {
            if (cell.digit === digit) return true
        }
        return false
    }
    isLTBase() {
        return this.cellsArr.length === 1 && this.cellsArr[0].count === 1n
    }
    moduloBase() {
        return this.cellsArr[0].digit
    }
    hasEvenDigits() {
        for (let cell of this.cellsArr) {
            if ((cell.digit % 2n) === 0n) {
                return true
            }
        }
        return false
    }
    countEvenDigits() {
        let count = 0n
        for (let cell of this.cellsArr) {
            if (!(cell.digit % 2n)) {
                count += cell.count
            }
        }
        return Number(count)
    }
    multiplyBy(hugeInt) {
        return new HugeInt(this.value * hugeInt.value, this.base)
    }
    multiplyByBasePower(count) {
        if (this.cellsArr[0].digit === 0n) {
            this.cellsArr[0].count += count
        }
        else {
            this.cellsArr.unshift({
                count,
                digit: 0n
            })
        }
    }
    combineCells = function(startIndex = 0, endIndex = this.cellsArr.length - 1) {
        if (this.cellsArr.length === 1) return

        for (let cellIndex = startIndex; cellIndex < endIndex; cellIndex++) {
            const currentCell = this.cellsArr[cellIndex]
            let nextCell = this.cellsArr[cellIndex + 1]

            if (currentCell.count === 0n) currentCell.digit = nextCell.digit
            let deleteCount = 0

            while(nextCell && (nextCell.digit === currentCell.digit)) {
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
        if (index < 0) return

        const newCell = { count: cell.count - countToSplit, digit: cell.digit }
        this._addCellAfter(index, newCell)
        cell.count = countToSplit
    }
    splitCellBefore(cell, countToSplit) {
        let index = this.cellsArr.indexOf(cell)
        if (index < 0) return

        const newCell = { count: countToSplit, digit: cell.digit }
        this._addCellBefore(index, newCell)
        cell.count = cell.count - countToSplit
        return newCell
    }

    /**
     * @desc Returns the position of the cell (not the index)
     * @param cell {DigitCell}
     * @return bigint
     */
    cellPosition(cell) {
        let position = 0n
        for (let currentCell of this.cellsArr) {
            if (currentCell === cell) break
            position += currentCell.count
        }
        return position
    }

    /**
     * @desc Returns the index of the cell (not the position)
     * @param cell {DigitCell}
     * @return {number}
     */
    cellIndex(cell) {
        for (const [index, currentCell] of this.cellsArr.entries()) {
            if (currentCell === cell) return index
        }
        return -1
    }

    /**
     *
     * @param index
     * @return {DigitCell}
     */
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
        let currentNumber = { count: 0n , digit: 0n }

        for (let number of tmpArr) {
            if (number.digit === currentNumber.digit) {
                currentNumber.count+= number.count
            }
            else {
                if (currentNumber.count !== 0n) {
                    newArr.push(currentNumber)
                }
                currentNumber = { ...number }
            }
        }
        if (currentNumber.count !== 0) {
            newArr.push(currentNumber)
        }
        this.cellsArr = newArr
    }

    /**
     *
     * @param digit { string }
     */
    contains(digit) {
        for (let cell of this.cellsArr) {
            if (baseDigits[cell.digit] === digit) {
                return true
            }
        }
        return false
    }
    toString2() {
        //slower
        const tmpArr = []

        for (let cell of this.cellsArr) {
            tmpArr.unshift(baseDigits[cell.digit].repeat(Number(cell.count)))
        }
        return tmpArr.join('')
    }
    toString() {
        let tmpStr = ''

        for (let cell of this.cellsArr) {
            tmpStr = baseDigits[cell.digit].repeat(Number(cell.count)) + tmpStr
        }
        return tmpStr
    }
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

export default HugeInt