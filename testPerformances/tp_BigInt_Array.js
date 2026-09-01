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

const tests = [
    function(num) {
        let v = BigInt(num)
        if (num === 1000) {
            number1 = 0
        }
        return v
    },
    function(num) {
        let v = tbi[num]
        if (num === 1000) {
            number2 = 0
        }
        return v
    },
]
const getArgs = [
    () => (number1++),
    () => (number2++),
]

testPerformances({ tests, getArgs }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})
