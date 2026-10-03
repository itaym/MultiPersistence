/** Benchmark: three ways to get the digit product of a large base-9 number. */
import testPerformances from './testPerformances.js'

const BASE = 9
const BASE_N = 9n
const DIGITS = Number(process.env.DIGITS) || 250
const POOL_SIZE = 500

// ---------------------------------------------------------------------------
// input pool — zero-free numbers of exactly DIGITS base-9 digits
// ---------------------------------------------------------------------------

let seed = 0x1a2b3c4d

/**
 * Deterministic pseudo-random number in [0, 1].
 *
 * @returns {number}
 */
const rnd = () => ((seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff) / 0x7fffffff)

const pool = []

while (pool.length < POOL_SIZE) {
    let n = 0n
    for (let i = 0; i < DIGITS; i++) n = n * BASE_N + BigInt(1 + Math.floor(rnd() * (BASE - 1)))
    pool.push(n)
}

// ---------------------------------------------------------------------------
// fn_0 — the current BIStrArr + reduce chain
// ---------------------------------------------------------------------------

/** @type {Object<string, bigint>} */
const valueByChar = { 0: 0n, 1: 1n, 2: 2n, 3: 3n, 4: 4n, 5: 5n, 6: 6n, 7: 7n, 8: 8n }

/**
 * Via `toString`, `split` and a lookup.
 *
 * @param {bigint} n
 * @returns {bigint}
 */
const viaCurrentChain = n => {
    const str = n.toString(BASE)
    if (str.includes('0')) return 0n
    const chars = str.split('')
    const vals = []
    for (let i = 0; i < chars.length; i++) vals[i] = valueByChar[chars[i]]
    let p = vals[0]
    for (let i = 1; i < vals.length; i++) p *= vals[i]
    return p
}

// ---------------------------------------------------------------------------
// fn_1 — chunked peel
// ---------------------------------------------------------------------------

/** @type {bigint[]} `BigInt(d)` for every digit `d` */
const digit = Array.from({ length: BASE }, (_, d) => BigInt(d))
const CHUNK_K = 16                       // 9^16 ~ 1.85e15 < 2^53
const CHUNK = BASE_N ** BigInt(CHUNK_K)

/**
 * By peeling Number chunks of `CHUNK_K` digits.
 *
 * @param {bigint} n
 * @returns {bigint}
 */
const viaChunked = n => {
    let p = 1n
    while (n >= CHUNK) {
        let c = Number(n % CHUNK)
        n /= CHUNK
        for (let i = 0; i < CHUNK_K; i++) {
            const d = c % BASE
            if (d === 0) return 0n
            p *= digit[d]
            c = (c - d) / BASE
        }
    }
    let top = Number(n)
    while (top > 0) {
        const d = top % BASE
        if (d === 0) return 0n
        p *= digit[d]
        top = (top - d) / BASE
    }
    return p
}

// ---------------------------------------------------------------------------
// fn_2 — divide & conquer
// ---------------------------------------------------------------------------

/** @type {bigint[]} `POWERS[k] = BASE ** (2 ** k)` */
const POWERS = [BASE_N]                  // POWERS[k] = base^(2^k)
while (POWERS.length < 16) POWERS.push(POWERS[POWERS.length - 1] ** 2n)

/**
 * Digit product of `x` read as exactly `2 ** k` digits (leading zeros count).
 *
 * @param {number} k
 * @param {bigint} x
 * @returns {bigint}
 */
const paddedProduct = (k, x) => {
    if (k === 0) return x                // one digit (0n .. base-1)
    const half = POWERS[k - 1]
    const hi = paddedProduct(k - 1, x / half)
    if (hi === 0n) return 0n
    const lo = paddedProduct(k - 1, x % half)
    if (lo === 0n) return 0n
    return hi * lo
}

/**
 * By divide and conquer on `POWERS`.
 *
 * @param {bigint} n
 * @returns {bigint}
 */
const viaDivideConquer = n => {
    if (n < BASE_N) return n
    let k = 0
    while (k + 1 < POWERS.length && POWERS[k + 1] <= n) k++
    const hi = viaDivideConquer(n / POWERS[k])   // top part — no leading zeros
    if (hi === 0n) return 0n
    const lo = paddedProduct(k, n % POWERS[k])   // bottom 2^k digits — padded
    if (lo === 0n) return 0n
    return hi * lo
}

// ---------------------------------------------------------------------------
// sanity — the three must agree, on the pool and on zero-digit cases
// ---------------------------------------------------------------------------

for (const x of pool) {
    const a = viaCurrentChain(x)
    const b = viaChunked(x)
    const c = viaDivideConquer(x)
    if (a !== b || a !== c) {
        throw new Error(`mismatch on ${x}\n  chain ${a}\n  chunk ${b}\n  d&c   ${c}`)
    }
}

for (const z of [9n, 10n, 90n, 900n, 12_345n, 9n ** 40n, 9n ** 40n + 7n, 9n ** 128n + 5n]) {
    const a = viaCurrentChain(z)
    if (viaChunked(z) !== a || viaDivideConquer(z) !== a) {
        throw new Error(`zero-case mismatch on ${z}: chain ${a} chunk ${viaChunked(z)} d&c ${viaDivideConquer(z)}`)
    }
}

// ---------------------------------------------------------------------------
// benchmark — all three get the same pool entry each iteration
// ---------------------------------------------------------------------------

const L = pool.length
let i0 = 0
let i1 = 0
let i2 = 0

testPerformances({
    multiplyBy: 1,
    numIterations: 1_000_000_001,
    showAfter: Number(process.env.SHOW_AFTER) || 200_000,
    warmupIterations: Number(process.env.WARMUP) || 200_000,
}, {
    getArgs: [
        () => pool[i0++ % L],
        () => pool[i1++ % L],
        () => pool[i2++ % L],
    ],
    tests: [viaCurrentChain, viaChunked, viaDivideConquer],
})
