import testPerformances from './testPerformances.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
const warmupIterations = 1_000_000

let number1 = 2n
let number2 = 2n

const tests = [
    function(num) {
        let s = num.toString()
        if (s.length > 300) {
            number1 = 2n
        }
    },
    function(num) {
        let s = num + ''
        if (s.length > 300) {
            number2 = 2n
        }
    },
]
const getArgs = [
    () => (number1 *= 3n, number1 /= 2n),
    () => (number2 *= 3n, number2 /= 2n),
]

testPerformances({ tests, getArgs }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})
