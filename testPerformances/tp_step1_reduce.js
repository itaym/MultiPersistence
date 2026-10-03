/** Benchmark: three ways to get a product's length and next digit product. */
import { digitsValue } from '#Digits/index.js'
import testPerformances from './testPerformances.js'

const BASE = 9
const BASE_N = 9n

// ---- pool of realistic step-1 products ----
let seed = 0x2f6a1cd3

/**
 * Deterministic pseudo-random number in [0, 1].
 *
 * @returns {number}
 */
const rnd = () => ((seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff) / 0x7fffffff)

const pool = []

while (pool.length < 400) {
    let n = 0n
    for (let i = 0; i < 150; i++) n = n * BASE_N + BigInt(2 + Math.floor(rnd() * 7))
    let p = 1n
    let m = n
    while (m > 0n) { p *= m % BASE_N; m /= BASE_N }
    pool.push(p)
}

// ---- fn_0: current path ----
/**
 * Via `toString` and a digit lookup.
 *
 * @param {bigint} product
 * @returns {Step1Result}
 */
const fn0 = product => {
    const str = product.toString(BASE)
    const productLength = str.length
    if (str.includes('0')) return { productLength, step2: 0n }
    let step2 = 1n
    for (let i = 0; i < str.length; i++) step2 *= digitsValue[str[i]]
    return { productLength, step2 }
}

// ---- fn_1: BigInt peel ----
/** @type {bigint[]} `BigInt(d)` for every digit `d` */
const DIGIT = Array.from({ length: BASE }, (_, d) => BigInt(d))

/**
 * By peeling BigInt digits.
 *
 * @param {bigint} product
 * @returns {Step1Result}
 */
const fn1 = product => {
    let step2 = 1n
    let productLength = 0
    let zero = false
    let p = product
    while (p > 0n) {
        const d = p % BASE_N
        p /= BASE_N
        productLength++
        if (d === 0n) zero = true
        else if (!zero) step2 *= d
    }
    return { productLength, step2: zero ? 0n : step2 }
}

// ---- fn_2: chunked peel ----
const K = 15
const CHUNK = BASE_N ** BigInt(K)

/**
 * By peeling `K`-digit Number chunks.
 *
 * @param {bigint} product
 * @returns {Step1Result}
 */
const fn2 = product => {
    let step2 = 1n
    let productLength = 0
    let zero = false
    let p = product
    while (p >= CHUNK) {
        let c = Number(p % CHUNK)
        p /= CHUNK
        for (let i = 0; i < K; i++) {
            const d = c % BASE
            c = (c - d) / BASE
            productLength++
            if (d === 0) zero = true
            else if (!zero) step2 *= DIGIT[d]
        }
    }
    let top = Number(p)
    while (top > 0) {
        const d = top % BASE
        top = (top - d) / BASE
        productLength++
        if (d === 0) zero = true
        else if (!zero) step2 *= DIGIT[d]
    }
    return { productLength, step2: zero ? 0n : step2 }
}

// ---- sanity: fn_1/fn_2 agree with fn_0 on length + step2 ----
for (const x of pool) {
    const a = fn0(x)
    const b = fn1(x)
    const c = fn2(x)
    if (a.productLength !== b.productLength || a.productLength !== c.productLength ||
        a.step2 !== b.step2 || a.step2 !== c.step2) {
        throw new Error(`mismatch on ${x}\n  ${JSON.stringify(a)}\n  ${JSON.stringify(b)}\n  ${JSON.stringify(c)}`)
    }
}

const L = pool.length
let i0 = 0
let i1 = 0
let i2 = 0

testPerformances({
    multiplyBy: 1,
    numIterations: 1_000_000_001,
    showAfter: 500_000,
    warmupIterations: 500_000,
}, {
    getArgs: [() => pool[i0++ % L], () => pool[i1++ % L], () => pool[i2++ % L]],
    tests: [fn0, fn1, fn2],
})
