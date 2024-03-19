import measureTime from './utils/measureTime.js'

const arraySize = 1_00
const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
const testArray = Array(arraySize).fill(0).map((_, index) => BigInt(index))
const warmupIterations = 1_000_000

let run, counter

const showStats = (fn1, fn2, multiplyBy) => console.table({ fn1: fn1.stats(multiplyBy), fn2: fn2.stats(multiplyBy) })

function test_1(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
}
function test_2(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
}
const fn1 = measureTime(test_1)
const fn2 = measureTime(test_2)

run = { fn1, fn2 }

for (let x = 0; x < warmupIterations; x++) {
    run.fn1(testArray)
    run.fn2(testArray)
}
fn1.reset()
fn2.reset()

counter = 1

for (; counter < numIterations / 2; counter++) {

    run.fn1(testArray)
    run.fn2(testArray)

    if (counter % showAfter === 0) {
        showStats(fn1, fn2, multiplyBy)
    }
}

run = { fn2, fn1 }
counter = 1

for (;counter < numIterations / 2; counter++) {

    run.fn2(testArray)
    run.fn1(testArray)

    if (counter % showAfter === 0) {
        showStats(fn1, fn2, multiplyBy)
    }
}
