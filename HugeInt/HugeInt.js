import { digitsObj as baseDigits, digitsValue } from '../Digits/index.js'

const  tbi = new Array(20_000)
for (let int = 0; int < 20_000; int++) {
    tbi[int] = BigInt(int)
}

function HugeInt(initBigInt = 0n, base = 10) {

    let addCellAfter = function(index, cell) {
        cellsArr.splice(index + 1, 0, cell)
    }

    let addCellBefore = function(index, cell) {
        if (index === -1) {
            cellsArr.unshift(cell)
            return
        }
        cellsArr.splice(index, 0, cell)
    }

    let startIndex = 0
    let cellsArr
    let baseMinusOne

    class HugeInt {

        constructor(initBigInt = 0n, base = 10n) {
            this.tbi = tbi
            this.base = base
            baseMinusOne = this.base - 1n
            this.cellsArr = []
            cellsArr = this.cellsArr
            initBigInt = BigInt(initBigInt < 1n ? 0n : initBigInt)

            if (initBigInt === 0n) {
                cellsArr.push({
                    count: 1n,
                    digit: 0n
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
                        cellsArr.push(currentCell)
                        currentCell = {
                            count: 1n,
                            digit,
                        }
                    }
                }
                cellsArr.push(currentCell)
            }
            addCellAfter = addCellAfter.bind(this)
            addCellBefore = addCellBefore.bind(this)
        }

        get length() {
            return cellsArr.reduce((a, b, currentIndex) => {
                if (currentIndex < startIndex) return 0n
                return b.count + a
            }, 0n)
        }

        get cellsLength() {
            return cellsArr.length
        }

        get secondCell() {
            return cellsArr[startIndex + 1]
        }

        get startIndex() {
            return startIndex
        }

        set startIndex(newValue) {
            startIndex = newValue
        }

        get firstCell() {
            return cellsArr[startIndex]
        }

        get beforeLastCell() {
            if ((this.cellsLength - 2) < startIndex) return undefined
            return cellsArr[this.cellsLength - 2]
        }

        get lastCell() {
            return cellsArr[this.cellsLength - 1]
        }

        get value() {
            let value = 0n
            let power = 0n
            let base = this.base
            for (let cellIndex = startIndex; cellIndex < cellsArr.length; cellIndex++) {
                let cell = cellsArr[cellIndex]
                const digit = cell.digit
                for (let x = 0; x < cell.count; x++) {
                    value += digit * (base ** power)
                    power++
                }
            }
            return value
        }
        initStartIndex() {
            cellsArr.splice(0, startIndex)
            startIndex = 0
        }

        createSorted(value, base = 10n) {
            this.base = base
            baseMinusOne = this.base - 1n
            const cache = {}

            do {
                const digit = value % base || base
                value /= base
                if (!cache[digit])
                    cache[digit] = {count: 1n, digit}
                else
                    cache[digit].count++
            } while (value !== 0n)
            startIndex = 0
            cellsArr = Object.values(cache)
            this.cellsArr = cellsArr
            cellsArr.sort((aCell, bCell) => {
                return Number(bCell.digit - aCell.digit)
            })
            if (cellsArr[0].digit === base) cellsArr[0].digit = 0n
        }

        fromString(str, base) {

            startIndex = 0
            const digitsArr = str.match(/((.)\2*)/g) || [str]
            cellsArr = Array(digitsArr.length)
            this.cellsArr = cellsArr
            let x = 0
            for (let digitIndex = digitsArr.length - 1; digitIndex > -1; digitIndex--) {
                const digits = digitsArr[digitIndex]
                cellsArr[x++] = {count: this.tbi[digits.length], digit: digitsValue[digits[0]]}
            }
            this.base = base
            baseMinusOne = this.base - 1n

        }

        clone() {
            const newHugeInt = new HugeInt(0n, this.base)
            newHugeInt.cellsArr = cellsArr.map(cell => ({...cell}))
            newHugeInt.startIndex = startIndex
            return newHugeInt
        }

        digitAt(digitIndex) {
            let cellIndex = startIndex
            digitIndex = Math.min(digitIndex, this.length)
            let count = cellsArr[cellIndex].count
            while (count - 1n < digitIndex) {
                cellIndex++
                count += cellsArr[cellIndex].count
            }
            return cellsArr[cellIndex].digit
        }

        addOne(cellRelativeToStartIndex) {
            const cellIndex = cellRelativeToStartIndex + startIndex
            let cell = cellsArr[cellIndex]

            if (cell.digit !== baseMinusOne) {
                if (cell.count === 1n) {
                    cell.digit++
                    return
                }
                addCellAfter(cellIndex, {
                    count: cell.count - 1n,
                    digit: cell.digit,
                })
                cell.count = 1n
                cell.digit++
                return
            }

            cell.digit = 0n

            // if (cellIndex && cellsArr[cellIndex - 1].digit === 0n) {
            //     cellsArr[cellIndex - 1].count += cell.count
            //     cellsArr.splice(cellIndex, 1)
            //     cellIndex--
            // }
            if (cellIndex === this.cellsLength - 1) {
                cellsArr.push({
                    count: 1n,
                    digit: 2n // 1n
                })
                return
            }
            this.addOne(cellIndex + 1 - startIndex)
            // if (cellIndex && (cellsArr[cellIndex - 1].digit === cell.digit)) {
            //     console.log('sdf')
            //     cellsArr[cellIndex - 1].count += cell.count
            //     cellsArr.splice(cellIndex, 1)
            // }
            // if (cellIndex < (this.cellsLength - 1) && (cellsArr[cellIndex + 1].digit === cell.digit)) {
            //     console.log('sdf')
            //     cellsArr[cellIndex].count += cellsArr[cellIndex + 1].count
            //     cellsArr.splice(cellIndex + 1, 1)
            // }
        }

        subtractOne(cellRelativeToStartIndex) {
            const cellIndex = cellRelativeToStartIndex + startIndex
            let cell = cellsArr[cellIndex]

            if (cell.digit !== 0n) {
                if (cell.count === 1n) {
                    cell.digit--
                    return
                } else {
                    addCellAfter(cellIndex, {
                        count: cell.count - 1n,
                        digit: cell.digit,
                    })
                    cell.count = 1n
                    cell.digit--
                    return
                }
            }

            cell.digit = baseMinusOne

            // if (cellIndex && cellsArr[cellIndex - 1].digit === 0n) {
            //     cellsArr[cellIndex - 1].count += cell.count
            //     cellsArr.splice(cellIndex, 1)
            //     cellIndex--
            // }
            if (cellIndex === this.cellsLength - 1) {
                cell.digit = 0n
                // cellsArr.push({
                //     count: 1n,
                //     digit: 2n // 1n
                // })
                return
            }
            this.subtractOne(cellIndex + 1 - startIndex)
            // if (cellIndex && (cellsArr[cellIndex - 1].digit === cell.digit)) {
            //     console.log('sdf')
            //     cellsArr[cellIndex - 1].count += cell.count
            //     cellsArr.splice(cellIndex, 1)
            // }
            // if (cellIndex < (this.cellsLength - 1) && (cellsArr[cellIndex + 1].digit === cell.digit)) {
            //     console.log('sdf')
            //     cellsArr[cellIndex].count += cellsArr[cellIndex + 1].count
            //     cellsArr.splice(cellIndex + 1, 1)
            // }
        }

        addBasePower(numOfZeros) {
            if (numOfZeros === 0) {
                return this.addOne(0)
            }
            let cellIndex = startIndex

            while (cellsArr[cellIndex].count <= numOfZeros) {
                numOfZeros -= cellsArr[cellIndex].count
                cellIndex++
                if (cellIndex === this.cellsLength) break
            }
            if (cellIndex === this.cellsLength) {
                if (numOfZeros > 0) {
                    cellsArr.push({
                        count: numOfZeros,
                        digit: 0n
                    })
                }
                cellsArr.push({
                    count: 1n,
                    digit: 1n
                })
            } else {
                if (cellsArr[cellIndex].count === 1n) {
                    this.addOne(cellIndex - startIndex)
                    return
                }
                if (numOfZeros > 0) {
                    addCellBefore(cellIndex, {
                        count: tbi[numOfZeros],
                        digit: cellsArr[cellIndex].digit
                    })
                    cellIndex++
                    cellsArr[cellIndex].count -= tbi[numOfZeros]
                }
                if (cellsArr[cellIndex].count > 1n) {
                    addCellAfter(cellIndex, {
                        count: cellsArr[cellIndex].count - 1n,
                        digit: cellsArr[cellIndex].digit
                    })
                    cellsArr[cellIndex].count = 1n
                }
                this.addOne(cellIndex - startIndex)
            }
        }

        divideBy10power(count) {
            while (count) {
                const lastCell = cellsArr[cellsArr.length - 1]
                if (lastCell.count >= count) {
                    lastCell.count -= count
                    count = 0
                } else {
                    count -= lastCell.count
                    cellsArr.pop()
                }
            }
        }

        isGTBase() {
            return (!(this.cellsLength - startIndex === 1 && cellsArr[startIndex].count === 1n))
        }

        isGT(hugeInt) {
            if (this.length > hugeInt.length) {
                return true
            }
            if (this.length < hugeInt.length) {
                return false
            }
            for (let cellIndex = this.cellsLength - 1; cellIndex >= 0; cellIndex--) {
                const thisCell = cellsArr[cellIndex]
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
            return cellsArr[index].digit === digit
        }

        includes(digit) {
            for (let cell of cellsArr) {
                if (cell.digit === digit) return cell.count
            }
            return 0
        }

        includesCellOf(digit) {
            for (let x = startIndex; x < cellsArr.length; x++)
                if (cellsArr[x].digit === digit) return [cellsArr[x], x]
            return [null, -1]
        }

        includesCellOf2(digit) {
            for (let x = cellsArr.length - 1; x > -1 + startIndex; x--)
                if (cellsArr[x].digit === digit) return [cellsArr[x], x]
            return [null, -1]
        }

        includesCellAtIndex0Of(digit) {
            if (cellsArr[startIndex].digit === digit) {
                return [cellsArr[startIndex], 0]
            }
            return [null, -1]
        }

        getCellOf(digit) {
            for (let cellIndex = startIndex; cellIndex < cellsArr.length; cellIndex++) {
                if (cellsArr[cellIndex].digit === digit) return cellsArr[cellIndex]
            }
            return null
        }

        isCellOf(digit) {
            for (let cellIndex = startIndex; cellIndex < cellsArr.length; cellIndex++) {
                if (cellsArr[cellIndex].digit === digit) return true
            }
            return false
        }

        isLTBase() {
            return cellsArr.length === (1 - startIndex) && cellsArr[startIndex].count === 1n
        }

        moduloBase() {
            return cellsArr[startIndex].digit
        }

        hasEvenDigits() {
            for (let cellIndex = startIndex; cellIndex < cellsArr.length; cellIndex++) {
                if ((cellsArr[cellIndex].digit % 2n) === 0n) {
                    return true
                }
            }
            return false
        }

        countEvenDigits() {
            let count = 0n
            for (let cellIndex = startIndex; cellIndex < cellsArr.length; cellIndex++) {
                if (!(cellsArr[cellIndex].digit % 2n)) {
                    count += cellsArr[cellIndex].count
                }
            }
            return Number(count)
        }

        multiplyBy(hugeInt) {
            return new HugeInt(this.value * hugeInt.value, this.base)
        }

        multiplyByBasePower(count) {
            if (cellsArr[startIndex].digit === 0n) {
                cellsArr[startIndex].count += count
            } else if (startIndex !== 0) {
                startIndex--
                cellsArr[startIndex] = {
                    count,
                    digit: 0n
                }
            } else {
                cellsArr.unshift({
                    count,
                    digit: 0n
                })
            }
        }

        combineCells = function (startIndex = startIndex, endIndex = cellsArr.length - 1) {
            if (cellsArr.length === 1) return

            for (let cellIndex = startIndex; cellIndex < endIndex; cellIndex++) {
                const currentCell = cellsArr[cellIndex]
                let nextCell = cellsArr[cellIndex + 1]

                if (currentCell.count === 0n) currentCell.digit = nextCell.digit
                let deleteCount = 0

                while (nextCell && (nextCell.digit === currentCell.digit)) {
                    currentCell.count += nextCell.count
                    deleteCount++
                    nextCell = cellsArr[cellIndex + deleteCount + 1]
                }

                if (deleteCount !== 0) {
                    cellsArr.splice(cellIndex, deleteCount + 1, currentCell)
                }
            }
        }

        splitCellAfter(cell, countToSplit) {
            let index = cellsArr.indexOf(cell)
            if (index < startIndex) return

            const newCell = {count: cell.count - countToSplit, digit: cell.digit}
            addCellAfter(index, newCell)
            cell.count = countToSplit
        }

        splitCellBefore(cell, countToSplit) {
            let index = cellsArr.indexOf(cell)
            if (index < startIndex) return

            const newCell = {count: countToSplit, digit: cell.digit}
            addCellBefore(index, newCell)
            cell.count = cell.count - countToSplit
            return newCell
        }

        cellPosition(cell) {
            let position = 0n
            for (let currentCell of cellsArr) {
                if (currentCell === cell) break
                position += currentCell.count
            }
            return position
        }

        cellIndex(cell) {
            for (const [index, currentCell] of cellsArr.entries()) {
                if (currentCell === cell) return index
            }
            return -1
        }

        getCellByIndex(index) {
            return cellsArr[index]
        }

        sort() {
            const groups = cellsArr.group(number => number.digit)
            // cellsArr.sort((a, b) =>
            //     Number(a.digit - b.digit)
            // )
            const tmpArr = Object.values(groups).flat()
            const newArr = []
            tmpArr.sort((a, b) => Number(b.digit - a.digit))
            let currentNumber = {count: 0n, digit: 0n}

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
            cellsArr = newArr
        }

        contains(digit) {
            for (let cell of cellsArr) {
                if (baseDigits[cell.digit] === digit) {
                    return true
                }
            }
            return false
        }

        toString() {
            let tmpStr = ''
            for (let cellIndex = startIndex; cellIndex < cellsArr.length; cellIndex++) {
                let cell = cellsArr[cellIndex]
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
            return cellsArr[Symbol.iterator]()
        }
    }
    return new HugeInt(initBigInt, base)
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