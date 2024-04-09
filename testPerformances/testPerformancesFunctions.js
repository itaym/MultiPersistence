import HugeInt from '../HugeInt/index.js'
import { HugeInt2 } from '../HugeInt/HugeInt.js'
import { digitsValue } from '../Digits/index.js'
import testPerformances from './testPerformances.js'

const multiplyBy = 1_000 / 1_000
const numIterations = 1_000_000_001
const showAfter = 1_000_00
const warmupIterations = 1_000_000

const strArray = []

const createStr = () => {
    let length = 1 + Math.round(Math.random() * 100)
    let str = ''

    for (let x = 0; x < length; x++) {
        str += (1 + Math.round(Math.random() * 8))
    }
    length = Math.round(Math.random() * 10)
    return str.split('').sort().join('') + '0'.repeat(length)
}
for (let x = 0; x < 1_000; x++) {
    strArray.push(createStr())
}

const iterators = {
    iterator1: strArray[Symbol.iterator](),
    iterator2: strArray[Symbol.iterator](),
}

const getNext = (iteratorName) => {
    let { done, value } = iterators[iteratorName].next()
    if (done) {
        iterators[iteratorName] = strArray[Symbol.iterator]()
        return getNext(iteratorName)
    }
    return value
}

const onNotModuloBase1 = function () {

    let firstCell = this.cellsArr[this.startIndex]

    if (firstCell.digit === 0n) {

        let secondCell = this.cellsArr[this.startIndex + 1]

        secondCell.count += firstCell.count

        this.startIndex++

        if (this.startIndex> 1_000) {
            this.initStartIndex()
        }
    }
}
const onNotModuloBase2 = function () {

    let firstCell = this.firstCell

    if (firstCell.digit === 0n) {

        let secondCell = this.firstCell.next

        secondCell.count += firstCell.count
        secondCell.prev = null
        this.firstCell = secondCell
    }
}

const arrayWithZero = [0n]
function BIStrArr(currentNo = 0n, base) {
    let currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    const result = currentNoStr.split('')

    for (var x = 0; x < result.length; x++) {
        result[x] = digitsValue[result[x]]
    }
    return result
}
function reduce(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
}
function multiPer2(currentNo, base) {
    if (currentNo < base) return 0

    return 1 + multiPer2(reduce(BIStrArr(currentNo, base)), base)
}
const base = 10n
const mp1 = {
    multiPer: function (currentNo, base) {
        //if (currentNo.isLTBase()) return 0

        return 1 + multiPer2(mp1.reduceHI(currentNo), base)
    },
    reduceHI: function(hugeInt) {
        let lastResult = 1n
        const arr = hugeInt.cellsArr
        let startIndex = hugeInt.startIndex + 1

        while ((startIndex < arr.length) && arr[startIndex].changed) {
            startIndex++
        }
        if (startIndex < arr.length) {
            lastResult =  arr[startIndex].result
        }
        startIndex--
        for (; startIndex >= hugeInt.startIndex; startIndex--) {
            lastResult *= arr[startIndex].digit ** arr[startIndex].count
            arr[startIndex].changed = false
            arr[startIndex].result = lastResult
        }
        return lastResult
    }
}
const mp2 = {
    multiPer: function (currentNo, base) {
        //if (currentNo.isLTBase()) return 0

        return 1 + multiPer2(mp2.reduceHI(currentNo), base)
    },
    reduceHI: function(hugeInt) {
        let lastResult
        let cell = hugeInt.firstCell.next

        while (cell && cell.changed) cell = cell.next

        cell ?
            (lastResult = cell.result, cell = cell.prev) :
            (lastResult = 1n, cell = hugeInt.lastCell)

        do {
            lastResult *= cell.digit ** cell.count
            cell.changed = false
            cell.result = lastResult
            cell = cell.prev
        } while (cell)

        return lastResult
    }
}

const currentNo1 = new HugeInt(0n, base)
const currentNo2 = new HugeInt2(0n, base)
const onNotModuloBaseBind1 = onNotModuloBase1.bind(currentNo1)
const onNotModuloBaseBind2 = onNotModuloBase2.bind(currentNo2)
mp1.multiPer = mp1.multiPer.bind(null, currentNo1, Number(base))
mp2.multiPer = mp2.multiPer.bind(null, currentNo2, Number(base))
currentNo1.fromString('2'.repeat(1), base)
currentNo2.fromString('2'.repeat(1), base)

export const test_1 = function(str) {
    //currentNo1.fromString(str, base)
    onNotModuloBaseBind1()
    let s1 = currentNo1.value // mp1.multiPer()
    currentNo1.addOneToSorted(0)
    return s1
}
export const test_2 = function(str) {
    //currentNo2.fromString(str, base)
    onNotModuloBaseBind2()
    let s2 = currentNo2.value // mp2.multiPer()
    currentNo2.addOneToSorted()
    return s2
}
export const getArgs_1 = function () {
    return getNext('iterator1')
}
export const getArgs_2 = function () {
    return getNext('iterator2')
}

testPerformances({ test_1, test_2, getArgs_1, getArgs_2 }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})