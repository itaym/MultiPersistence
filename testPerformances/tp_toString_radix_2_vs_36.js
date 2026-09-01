import testPerformances from './testPerformances.js'

const multiplyBy = 1
const numIterations = 1_000_000_000
const showAfter = 1_000
const warmupIterations = 1_000

const tests = []
const getArgs = []

for (let i = 2; i < 37; i++) {
    const valueToTest = BigInt(Math.round(Math.random() *  123456778900987654321 * 2)) ** 100n
    const test = () => valueToTest.toString(i)
    const getArg = () => i

    getArgs.push(getArg)
    tests.push(test)
}

testPerformances({ tests, getArgs }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})
