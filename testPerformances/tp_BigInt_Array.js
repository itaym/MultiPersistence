/** Benchmark: `BigInt(n)` vs a lookup table of pre-built BigInt. */
import testPerformances from './testPerformances.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
const warmupIterations = 1_000_000

let number1 = 0
let number2 = 0

const tbi = new Array(1001)

for (let int = 0; int < 1001; int++) {
    tbi[int] = BigInt(int)
}

const tests = [
    num => {
        const v = BigInt(num)
        if (num === 1000) {
            number1 = 0
        }
        return v
    },
    num => {
        const v = tbi[num]
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

testPerformances({
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
}, { getArgs, tests })
