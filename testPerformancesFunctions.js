import ToPrimitive from './ToPrimitive/index.js'

const strArray = []

// const createStr = () => {
//     const length = Math.round(Math.random() * 200)
//     let str = ''
//
//     for (let x = 0; x < length; x++) {
//         str += Math.round(Math.random() * 9)
//     }
//     return str
// }
// for (let x = 0; x < 1_000; x++) {
//     strArray.push(createStr())
// }
//
// const iterators = {
//     iterator1: strArray[Symbol.iterator](),
//     iterator2: strArray[Symbol.iterator](),
// }
//
// const getNext = (iteratorName) => {
//     let { done, value } = iterators[iteratorName].next()
//     if (done) {
//         iterators[iteratorName] = strArray[Symbol.iterator]()
//         return getNext(iteratorName)
//     }
//     return value
// }

const w = new ToPrimitive({}, function () { return 1 })
const o = function () { return 1 }

export const test_1 = function(str) {
    return 1
}

export const test_2 = function(str) {
    return w
}

export const getArgs_1 = function () {
    return undefined
}

export const getArgs_2 = function () {
    return undefined
}