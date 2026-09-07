/**
 * Cost of the way a function is *dispatched*, when it takes a receiver.
 *
 * fn_0 — plain call, receiver passed as the first argument:  f(obj, a, b)
 * fn_1 — bound once outside the loop (current `prepareMessage` style): bound(a, b)
 * fn_2 — Function.prototype.call:  f.call(obj, a, b)
 * fn_3 — bound *inside* the loop (the real anti-pattern): f.bind(obj)(a, b)
 * fn_4 — method on the prototype:  obj.method(a, b)
 *
 * Each measured call runs the target `K` times in a tight inner loop and
 * `multiplyBy = K`, so the per-call number isn't drowned by the two
 * `performance.now()` reads the harness adds around every measured call.
 *
 * The target mirrors `prepareMessage`: spread a small object, read one field off
 * the receiver, return a fresh object.
 *
 * Note for the search: `prepareMessage` is called only on a *found* number
 * (steps !== 2), which is rare — it is not on the hot path, so unbinding it
 * won't move the search's throughput. This benchmark is the general number.
 */

import testPerformances from './testPerformances.js'

const K = 500

const payload = { additionSum: 7n, multiplySum: 9n, steps: 3, productLength: 5 }

const receiver = { tag: 'x'.repeat(24) }

function withThis(startTime, calcIter) {
    return { ...payload, atRunTime: calcIter - startTime, tag: this.tag, next: null }
}

function plain(self, startTime, calcIter) {
    return { ...payload, atRunTime: calcIter - startTime, tag: self.tag, next: null }
}

const boundOnce = withThis.bind(receiver)

class Receiver {
    constructor() { this.tag = 'x'.repeat(24) }

    make(startTime, calcIter) {
        return { ...payload, atRunTime: calcIter - startTime, tag: this.tag, next: null }
    }
}
const instance = new Receiver()

/**
 * Wraps one dispatch style in the inner repeat loop. `call(n, i)` must return a
 * number so the loop can't be optimized away.
 *
 * @param {(n: number, i: number) => number} call
 * @returns {(n: number) => number}
 */
const repeat = (call) => (n) => {
    let acc = 0
    for (let i = 0; i < K; i++) acc += call(n, i)
    return acc
}

const tests = [
    repeat((n, i) => plain(receiver, n, n + i).atRunTime),
    repeat((n, i) => boundOnce(n, n + i).atRunTime),
    repeat((n, i) => withThis.call(receiver, n, n + i).atRunTime),
    repeat((n, i) => withThis.bind(receiver)(n, n + i).atRunTime),
    repeat((n, i) => instance.make(n, n + i).atRunTime),
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

testPerformances({ tests, getArgs }, {
    multiplyBy: K,
    numIterations: 1_000_000_001,
    showAfter: Number(process.env.SHOW_AFTER) || 20_000,
    warmupIterations: Number(process.env.WARMUP) || 20_000,
})
