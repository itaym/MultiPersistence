import testPerformances from './testPerformances.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
const warmupIterations = 1_000_000

let number1 = 2n
let number2 = 2n

const test_1 = function(num) {
    let s = num + ''
    if (s.length > 200) {
        number1=2n
    }
}
const test_2 = function(num) {
    let s = num + ''
    if (s.length > 200) {
        number2=2n
    }
}
const getArgs_1 = () => (number1 *= 3n, number1 /= 2n)
const getArgs_2 = () => (number2 *= 3n, number2 /= 2n)

testPerformances({ test_1, test_2, getArgs_1, getArgs_2 }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})