import testPerformances from './testPerformances.js'

const multiplyBy = 1 / 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
const warmupIterations = 1_000_000
let number = 2n

const test_1 = function(num) {
    let s = num.toString()
    if (s.length > 300) {
        number=2n
    }
}
const test_2 = function(num) {
    let s = num + ''
    if (s.length > 300) {
        number=2n
    }
}
const getArgs_1 = () => (number *= 3n, number /= 2n, number)
const getArgs_2 = () => (number *= 3n, number /= 2n, number)

testPerformances({ test_1, test_2, getArgs_1, getArgs_2 }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})