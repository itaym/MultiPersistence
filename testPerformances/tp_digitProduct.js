/**
 * Getting the base-`b` digit product of a BigInt — the inner step of `multiPer2`.
 * Three ways to decompose the number:
 *
 * fn_0 — current chain: `n.toString(b)` -> `split('')` -> char->value -> multiply
 *        (this is `BIStrArr` + `reduce` from multiplicativePersistence.js)
 * fn_1 — chunked peel: take `K` digits per BigInt `%`, peel them with number math
 * fn_2 — divide & conquer: `divmod` by precomputed `b^(2^k)`, recurse (GMP's
 *        `mpn_get_str` shape) — the only one that is sub-quadratic
 *
 * Input pool: 500 zero-free base-9 numbers of exactly `DIGITS` digits, so every
 * method does the full scan (no early bail). This is the case that matters — a
 * step-1 product with no zero digit is the one whose chain keeps going.
 *
 * Bump `DIGITS` (env var) and rerun to see where fn_2 overtakes fn_0. Real
 * step-1 products in the live base-9 search sit around 200–300 digits.
 *
 * Measured (Win11, node, one machine — ratios are what matter):
 *
 *   digits | fn_0 toString | fn_1 chunked | fn_2 d&c | winner
 *   -------|---------------|--------------|----------|------------------------
 *     250  |     39,836/s  |    29,040/s  | 16,315/s | toString  (2.4x vs d&c)
 *    1000  |      3,096/s  |     2,441/s  |  2,120/s | toString  (1.46x)
 *    4000  |        354/s  |       240/s  |    419/s | d&c       (1.18x)
 *
 * So at the search's real scale `bigint.toString(radix)` already wins clearly —
 * V8 runs it in optimized C++ and the JS-level d&c can't beat the constant
 * factor until the numbers reach a few thousand digits, where V8's ~O(n^2)
 * toString finally loses to d&c's asymptotics. The chunked peel (the old
 * approach) is slower than toString at every size.
 */

import testPerformances from './testPerformances.js'

const BASE = 9
const BASE_N = 9n
const DIGITS = Number(process.env.DIGITS) || 250
const POOL_SIZE = 500

// ---------------------------------------------------------------------------
// input pool — zero-free numbers of exactly DIGITS base-9 digits
// ---------------------------------------------------------------------------

let seed = 0x1a2b3c4d
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)

const pool = []
while (pool.length < POOL_SIZE) {
    let n = 0n
    for (let i = 0; i < DIGITS; i++) n = n * BASE_N + BigInt(1 + Math.floor(rnd() * (BASE - 1)))
    pool.push(n)
}

// ---------------------------------------------------------------------------
// fn_0 — the current BIStrArr + reduce chain
// ---------------------------------------------------------------------------

const valueByChar = { 0: 0n, 1: 1n, 2: 2n, 3: 3n, 4: 4n, 5: 5n, 6: 6n, 7: 7n, 8: 8n }

const viaCurrentChain = (n) => {
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

const digit = Array.from({ length: BASE }, (_, d) => BigInt(d))
const CHUNK_K = 16                       // 9^16 ~ 1.85e15 < 2^53
const CHUNK = BASE_N ** BigInt(CHUNK_K)

const viaChunked = (n) => {
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

const POWERS = [BASE_N]                  // POWERS[k] = base^(2^k)
while (POWERS.length < 16) POWERS.push(POWERS[POWERS.length - 1] ** 2n)

/** product of `x`'s digits when `x` is written as exactly `2^k` base-b digits */
const paddedProduct = (x, k) => {
    if (k === 0) return x                // one digit (0n .. base-1)
    const half = POWERS[k - 1]
    const hi = paddedProduct(x / half, k - 1)
    if (hi === 0n) return 0n
    const lo = paddedProduct(x % half, k - 1)
    if (lo === 0n) return 0n
    return hi * lo
}

const viaDivideConquer = (n) => {
    if (n < BASE_N) return n
    let k = 0
    while (k + 1 < POWERS.length && POWERS[k + 1] <= n) k++
    const hi = viaDivideConquer(n / POWERS[k])   // top part — no leading zeros
    if (hi === 0n) return 0n
    const lo = paddedProduct(n % POWERS[k], k)   // bottom 2^k digits — padded
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
for (const z of [9n, 10n, 90n, 900n, 12345n, 9n ** 40n, 9n ** 40n + 7n, 9n ** 128n + 5n]) {
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
    tests: [viaCurrentChain, viaChunked, viaDivideConquer],
    getArgs: [
        () => pool[i0++ % L],
        () => pool[i1++ % L],
        () => pool[i2++ % L],
    ],
}, {
    multiplyBy: 1,
    numIterations: 1_000_000_001,
    showAfter: Number(process.env.SHOW_AFTER) || 200_000,
    warmupIterations: Number(process.env.WARMUP) || 200_000,
})
