/* eslint-disable prefer-destructuring */
/** Benchmark: `reduceHI` with vs without a running digit-product length. */
import HugeIntEx from '#HugeIntEx/index.js'
import testPerformances from './testPerformances.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 10_000_000
const warmupIterations = 1_000_000

const BASE = 9n
const START = 4_000_000_000_000n // ~14 base-9 digits, several distinct digits

/**
 * Search-style digit cell with a `productLen` cache.
 *
 * @returns {DigitCell}
 */
const cellFactory = () => ({
    additionSum: 0n,
    changed: true,
    count: 1n,
    digit: 0n,
    multiplySum: 0n,
    next: null,
    prev: null,
    productLen: 0,
})

/** @type {number[]} `log_BASE(d)` for every digit `d` */
const digitLogs = (() => {
    const lb = Math.log(Number(BASE))
    return Array.from({ length: Number(BASE) }, (_, d) => Math.log(d) / lb)
})()

/**
 * `reduceHI` as in multiplicativePersistence.js.
 *
 * @param {HugeIntEx} hugeInt
 * @returns {bigint} digit product
 */
const reduceHIPlain = hugeInt => {
    let cell = hugeInt.firstCell.next
    let multiplySum
    let additionSum

    while (cell && cell.changed) cell = cell.next

    cell
        ? (multiplySum = cell.multiplySum, additionSum = cell.additionSum, cell = cell.prev)
        : (multiplySum = 1n, additionSum = 0n, cell = hugeInt.lastCell)

    do {
        multiplySum *= cell.digit ** cell.count
        additionSum += cell.digit * cell.count
        cell.additionSum = additionSum
        cell.changed = false
        cell.multiplySum = multiplySum

        cell = cell.prev
    } while (cell)

    return multiplySum
}

/**
 * `reduceHI` also keeping a running base-`BASE` length of the digit product.
 *
 * @param {HugeIntEx} hugeInt
 * @returns {bigint} digit product
 */
const reduceHIWithLen = hugeInt => {
    let cell = hugeInt.firstCell.next
    let multiplySum
    let additionSum
    let productLen

    while (cell && cell.changed) cell = cell.next

    cell
        ? (multiplySum = cell.multiplySum, additionSum = cell.additionSum,
        productLen = cell.productLen, cell = cell.prev)
        : (multiplySum = 1n, additionSum = 0n, productLen = 0, cell = hugeInt.lastCell)

    do {
        multiplySum *= cell.digit ** cell.count
        additionSum += cell.digit * cell.count
        productLen += Number(cell.count) * digitLogs[Number(cell.digit)]
        cell.additionSum = additionSum
        cell.changed = false
        cell.multiplySum = multiplySum
        cell.productLen = productLen

        cell = cell.prev
    } while (cell)

    return multiplySum
}

const n0 = new HugeIntEx(BASE, cellFactory, START)
const n1 = new HugeIntEx(BASE, cellFactory, START)

const tests = [reduceHIPlain, reduceHIWithLen]

const getArgs = [
    () => (n0.addOneToSorted(), n0),
    () => (n1.addOneToSorted(), n1),
]

testPerformances({
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
}, { getArgs, tests })
