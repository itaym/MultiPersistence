import { digitsValue } from './Digits/index.js'
import measureTime from './utils/measureTime.js'

let grandLoopSize = 100_000_001 // Number.MAX_SAFE_INTEGER

let arraySize = 1_00
const arr = Array(arraySize).fill(0).map((_, index) => index)
const fn1 = measureTime(function(arr) {
    var result = arr[0]
    for (var x = 1; x < arr.length; x++) result *= arr[x]
    return result
})
const multiplyBy = 1 / arraySize
const fn2 = measureTime(function(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
})

for (let x = 1; x < grandLoopSize; x++) {

    fn1(arr)
    fn2(arr)

    if (x % 1_000_000 === 0) {
        console.table({ fn1: fn1.stats(multiplyBy), fn2: fn2.stats(multiplyBy) })
    }
}



//process.abort()