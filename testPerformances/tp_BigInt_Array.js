import testPerformances from './testPerformances.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
const warmupIterations = 1_000_000

let number1 = 0
let number2 = 0

const tbi = new Array(1_001)
for (let int = 0; int < 1_001; int++) {
    tbi[int] = BigInt(int)
}

const test_1 = function(num) {
    let v = BigInt(num)
    if (num === 1000) {
        number1 = 0
    }
    return v
}
const test_2 = function(num) {
    let v = tbi[num]
    if (num === 1000) {
        number2 = 0
    }
    return v
}
const getArgs_1 = () => (number1++)
const getArgs_2 = () => (number2++)

testPerformances({ test_1, test_2, getArgs_1, getArgs_2 }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})