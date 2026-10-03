/** Benchmark: ways to pass a receiver to a message builder (param, bound, `call`, `bind`, method). */
import testPerformances from './testPerformances.js'

const K = 500

/** @type {ReduceResults} */
const payload = { additionSum: 7n, multiplySum: 9n, productLength: 5, steps: 3 }

const receiver = { tag: 'x'.repeat(24) }

/**
 * @this {Tagged}
 * @param {number} calcIter
 * @param {number} startTime
 * @returns {BoundMessage}
 */
function withThis(calcIter, startTime) {
    return { ...payload, atRunTime: calcIter - startTime, next: null, tag: this.tag }
}

/**
 * @param {number} calcIter
 * @param {Tagged} self
 * @param {number} startTime
 * @returns {BoundMessage}
 */
const plain = (calcIter, self, startTime) =>
    ({ ...payload, atRunTime: calcIter - startTime, next: null, tag: self.tag })

const boundOnce = withThis.bind(receiver)

/** Receiver with the builder as a method. */
class Receiver {
    /** Tags the receiver. */
    constructor() { this.tag = 'x'.repeat(24) }

    /**
     * @param {number} calcIter
     * @param {number} startTime
     * @returns {BoundMessage}
     */
    make(calcIter, startTime) {
        return { ...payload, atRunTime: calcIter - startTime, next: null, tag: this.tag }
    }
}

const instance = new Receiver()

/**
 * Wraps `call` so one test run makes `K` calls.
 *
 * @param {(n: number, i: number) => number} call
 * @returns {(n: number) => number} summed results
 */
const repeat = call => n => {
    let acc = 0
    for (let i = 0; i < K; i++) acc += call(n, i)
    return acc
}

const tests = [
    repeat((n, i) => plain(n + i, receiver, n).atRunTime),
    repeat((n, i) => boundOnce(n + i, n).atRunTime),
    repeat((n, i) => withThis.call(receiver, n + i, n).atRunTime),
    repeat((n, i) => withThis.bind(receiver)(n + i, n).atRunTime),
    repeat((n, i) => instance.make(n + i, n).atRunTime),
]

// sanity — every style computes the same thing
{
    const want = tests[0](1000)
    tests.forEach((t, x) => {
        if (t(1000) !== want) throw new Error(`fn_${x} disagrees: ${t(1000)} != ${want}`)
    })
}

const counters = tests.map(() => 0)
const getArgs = counters.map((_, x) => () => (counters[x]++ & 0xffff))

testPerformances({
    multiplyBy: K,
    numIterations: 1_000_000_001,
    showAfter: Number(process.env.SHOW_AFTER) || 20_000,
    warmupIterations: Number(process.env.WARMUP) || 20_000,
}, { getArgs, tests })
