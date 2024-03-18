import { digitsObj as baseDigits, digitsValue } from '../Digits/index.js'

const  toBigInt = new Array(1_000)
for (let int = 0; int < 1_000; int++) {
    toBigInt[int] = BigInt(int)
}
const  toNumber = new Array(1_000).fill(0).map((_, index) => index)

class HugeInt {

    constructor(initBigInt = 0n, base = 10n) {
        this.toBigInt = toBigInt
        this.base = base
        this.baseMinusOne = this.base - 1n
        this.cellsArr = []
        this.startIndex = 0
        initBigInt = BigInt(initBigInt)

        if (initBigInt === 0n) {
            this.cellsArr.push({
                changed: true,
                count: 1n,
                digit: 0n,
            })
        } else {
            const bigIntBase = base
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
                        changed: true,
                        count: 1n,
                        digit,
                    }
                }
            }
            this.cellsArr.push(currentCell)
        }
    }

    /**
     * @desc returns the active amount of cells.
     * @return {number}
     */
    get cellsLength() {
        return this.cellsArr.length
    }
    /**
     * @desc returns the length of the HugeInt in the defined base
     * @return {bigint}
     */
    get length() {
        let length = 0n
        for (let index = this.startIndex; index < this.cellsArr.length; index++) {
            length += this.cellsArr[index].count
        }
        return length
    }



    get secondCell() {
        return this.cellsArr[this.startIndex + 1]
    }

    get firstCell() {
        return this.cellsArr[this.startIndex]
    }

    get beforeLastCell() {
        if ((this.cellsLength - 2) < this.startIndex) return undefined
        return this.cellsArr[this.cellsLength - 2]
    }

    get lastCell() {
        return this.cellsArr[this.cellsLength - 1]
    }

    get value() {
        let value = 0n
        let power = 0n
        let base = this.base
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
    addCellAfter(index, cell) {
        this.cellsArr.splice(index + 1, 0, cell)
    }

    addCellBefore(index, cell) {
        if (index === -1) {
            this.cellsArr.unshift(cell)
            return
        }
        this.cellsArr.splice(index, 0, cell)
    }
    initStartIndex() {
        this.cellsArr = this.cellsArr.slice(this.startIndex)
        //this.cellsArr.splice(0, this.startIndex)
        this.startIndex = 0
    }

    fromString(str, base) {

        this.startIndex = 0
        const digitsArr = str.match(/((.)\2*)/g) || [str]
        this.cellsArr = Array(digitsArr.length)
        let x = 0
        for (let index = digitsArr.length - 1; index > -1; index--) {
            const digits = digitsArr[index]
            this.cellsArr[x++] = {
                changed: true,
                count: this.toBigInt[digits.length],
                digit: digitsValue[digits[0]]}
        }
        this.base = base
        this.baseMinusOne = this.base - 1n
    }

    addOne(cellRelativeToStartIndex) {
        const cellIndex = cellRelativeToStartIndex + this.startIndex
        let cell = this.cellsArr[cellIndex]
        cell.changed = true

        if (cell.digit !== this.baseMinusOne) {
            if (cell.count === 1n) {
                cell.changed = true
                cell.digit++
                return
            }
            this.addCellAfter(cellIndex, {
                changed: true,
                count: cell.count - 1n,
                digit: cell.digit,
            })
            cell.count = 1n
            cell.digit++
            return
        }

        cell.digit = 0n

        // if (cellIndex && this.cellsArr[cellIndex - 1].digit === 0n) {
        //     this.cellsArr[cellIndex - 1].count += cell.count
        //     this.cellsArr.splice(cellIndex, 1)
        //     cellIndex--
        // }
        if (cellIndex === this.cellsArr.length - 1) {
            this.cellsArr.push({
                changed: true,
                count: 1n,
                digit: 2n // 1n
            })
            return
        }
        this.addOne(cellIndex + 1 - this.startIndex)
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

    subtractOne(cellRelativeToStartIndex) {
        const cellIndex = cellRelativeToStartIndex + this.startIndex
        let cell = this.cellsArr[cellIndex]

        if (cell.digit !== 0n) {
            if (cell.count === 1n) {
                cell.digit--
                cell.changed = true
                // cell.result = undefined
                return
            } else {
                this.addCellAfter(cellIndex, {
                    changed: true,
                    count: cell.count - 1n,
                    digit: cell.digit,
                })
                cell.count = 1n
                cell.digit--
                cell.changed = true
                // cell.result = undefined
                return
            }
        }

        cell.digit = this.baseMinusOne
        cell.changed = true
        // cell.result = undefined
        // if (cellIndex && this.cellsArr[cellIndex - 1].digit === 0n) {
        //     this.cellsArr[cellIndex - 1].count += cell.count
        //     this.cellsArr.splice(cellIndex, 1)
        //     cellIndex--
        // }
        if (cellIndex === this.cellsLength - 1) {
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
        return (!(this.cellsLength - this.startIndex === 1 && this.cellsArr[this.startIndex].count === 1n))
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

    multiplyBy(hugeInt) {
        return new HugeInt(this.value * hugeInt.value, this.base)
    }

    multiplyByBasePower(count) {
        if (this.cellsArr[this.startIndex].digit === 0n) {
            this.cellsArr[this.startIndex].count += count
            this.cellsArr[this.startIndex].changed = true
            // this.cellsArr[this.startIndex].result = undefined
        } else if (this.startIndex !== 0) {
            this.startIndex--
            this.cellsArr[this.startIndex] = {
                changed: true,
                count,
                digit: 0n
            }
        } else {
            this.cellsArr.unshift({
                changed: true,
                count,
                digit: 0n
            })
        }
    }

    combineCells = function (startIndex = this.startIndex, endIndex = this.cellsArr.length - 1) {
        if (this.cellsArr.length === 1) return

        for (let cellIndex = this.startIndex; cellIndex < endIndex; cellIndex++) {
            const currentCell = this.cellsArr[cellIndex]
            currentCell.changed = true
            // current// cell.result = undefined
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

        const newCell = {changed: true, count: cell.count - countToSplit, digit: cell.digit}
        this.addCellAfter(index, newCell)
        cell.count = countToSplit
        cell.changed = true
    }

    splitCellBefore(cell, countToSplit) {
        let index = this.cellsArr.indexOf(cell)
        if (index < this.startIndex) return

        const newCell = {changed: true, count: countToSplit, digit: cell.digit}
        this.addCellBefore(index, newCell)
        cell.count = cell.count - countToSplit
        cell.changed = true
        // cell.result = undefined
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
        let currentNumber = {changed: true, count: 0n, digit: 0n}

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

    toString() {
        let tmpStr = ''
        for (let cellIndex = this.startIndex; cellIndex < this.cellsArr.length; cellIndex++) {
            let cell = this.cellsArr[cellIndex]
            tmpStr = baseDigits.get(cell.digit).repeat(Number(cell.count)) + tmpStr
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
export default HugeInt //546

//---------------------------------------------------------------------------------------------------

export const MyClass = (() => {
    /** Shared variables and functions among instances */
    let sharedVariable1 = 'something'
    let sharedVariable2 = 'otherThing'

    /* DON'T USE 'this' OPERATOR AT ALL */

    /**
     * 'this' can be passed as an argument
     * @param {Constructor}_this
     * @param {*} anything
     * @return {string}
     */
    const sharedFunction1 = (_this, anything) => `Hello there ${anything}`
    /**
     * Can access Constructor statics
     * @param {*} anything
     * @return {string}
     */
    const sharedFunction2 = (anything) => `${Constructor.something} ${anything}`

    /**
     *
     * @return {Constructor}
     *
     */
    const Constructor = (() => {
        /** Variables and functions in instance closure */
        let closureVariable1 = 'closure something'
        let closureVariable2 = 'closure otherThing'

        /* DON'T USE 'this' OPERATOR AT ALL */
        /* BUT YOU CAN USE '_self' INSTEAD! */
        let _self

        /**
         * 'this' can be passed as an argument
         * @param {Constructor} _this
         * @param {*} anything
         * @return {string}
         */
        const closureFunction1 = (_this, anything) => sharedFunction1(_this, anything)
        /**
         * Can access Constructor statics
         * @param {*} anything
         * @return {string}
         */
        const closureFunction2 = (anything) => sharedFunction2(anything)
        /**
         *
         * @typedef {Constructor}
         *
         */
        class Constructor {
            constructor(...args) {
                _self = this
                this.args = args
            }

            /**
             * @static
             * @name something
             * @return {string}
             */
            static something() {
                return sharedVariable1
            }

            /**
             * @property
             * @name otherThing
             * @return {string}
             */
            get otherThing() {
                return sharedVariable2
            }

            /**
             * @property
             * @name otherThing
             * @param {string} value
             */
            set otherThing(value) {
                sharedVariable2 = value
            }

            /**
             *
             * @method
             * @return {string}
             */
            doSomething () {
                return sharedFunction1(
                    this,
                    closureFunction1(this, closureVariable1))
            }

            /**
             *
             * @method
             * @return {string}
             */
            doOtherThing () {
                return sharedFunction2(closureFunction2(closureVariable2))
            }
        }
        return Constructor
    })('Create user-blind closure')

    return (...args) => new Constructor(...args)
})('Create user-blind closure for cross-instances')



