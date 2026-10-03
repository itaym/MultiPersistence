/** Benchmark: `BigInt.prototype.toString` across radixes 2–36. */
import testPerformances from './testPerformances.js'

const multiplyBy = 1
const numIterations = 1_000_000_000
const showAfter = 1000
const warmupIterations = 1000

const tests = []
const getArgs = []

for (let i = 2; i < 37; i++) {
    const valueToTest = BigInt(Math.round(Math.random() * 6_778_900_987_654_321 * 2)) ** 100n
    /** @returns {string} `valueToTest` in radix `i` */
    const test = () => valueToTest.toString(i)
    /** @returns {number} the radix */
    const getArg = () => i

    getArgs.push(getArg)
    tests.push(test)
}

testPerformances({
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
}, { getArgs, tests })
