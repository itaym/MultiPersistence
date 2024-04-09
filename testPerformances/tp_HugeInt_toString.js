import HugeInt from '../HugeInt/index.js'
import testPerformances from './testPerformances.js'
import { HugeInt2 } from '../HugeInt/HugeInt.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
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

const base = 10n

const currentNo1 = new HugeInt(0n, base)
const currentNo2 = new HugeInt2(0n, base)

currentNo1.fromString('2'.repeat(1), base)
currentNo2.fromString('2'.repeat(1), base)

const test_1 = function(currentNo) {
    return  currentNo.toString()
}
const test_2 = function(currentNo) {
    return currentNo.toString()
}
export const getArgs_1 = function () {
    currentNo1.fromString(getNext('iterator1'), base)
    return currentNo1
}
export const getArgs_2 = function () {
    currentNo2.fromString(getNext('iterator2'), base)
    return currentNo2
}

testPerformances({ test_1, test_2, getArgs_1, getArgs_2 }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})