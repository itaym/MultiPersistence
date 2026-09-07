/**
 * Cost of adding a running "digit-product length" sum to `reduceHI`.
 *
 * fn_0 — `reduceHI` exactly as it is today.
 * fn_1 — the same, plus `productLen += Number(count) * log_base(digit)` and a
 *        `cell.productLen` cache write, one extra line in the walk.
 *
 * Both run over the same stream of `HugeIntEx` numbers, advanced with
 * `addOneToSorted()` each iteration (measured separately as ar_0 / ar_1), so the
 * `cell.changed` incremental path is exercised the way the real search does it.
 * The `percent` column shows fn_1 vs the two-function mean; anything inside the
 * run-to-run noise means the extra line is free.
 */

import testPerformances from './testPerformances.js'
import HugeIntEx from '../HugeIntEx/index.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 10_000_000
const warmupIterations = 1_000_000

const BASE = 9n
const START = 4_000_000_000_000n // ~14 base-9 digits, several distinct digits

/** search-style cell: the persistence caches live here, plus `productLen` */
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

/** log_base(d) for every digit d in [0, BASE); computed once */
const digitLogs = (() => {
    const lb = Math.log(Number(BASE))
    return Array.from({ length: Number(BASE) }, (_, d) => Math.log(d) / lb)
})()

/** `reduceHI` as it stands in multiplicativePersistence.js */
function reduceHIPlain(hugeInt) {
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

/** the same, carrying a running base-`b` length of the digit product */
function reduceHIWithLen(hugeInt) {
    let cell = hugeInt.firstCell.next
    let multiplySum
    let additionSum
    let productLen

    while (cell && cell.changed) cell = cell.next

    cell
        ? (multiplySum = cell.multiplySum, additionSum = cell.additionSum, productLen = cell.productLen, cell = cell.prev)
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

const n0 = new HugeIntEx(START, BASE, cellFactory)
const n1 = new HugeIntEx(START, BASE, cellFactory)

const tests = [reduceHIPlain, reduceHIWithLen]
const getArgs = [
    () => (n0.addOneToSorted(), n0),
    () => (n1.addOneToSorted(), n1),
]

testPerformances({ getArgs, tests }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})
