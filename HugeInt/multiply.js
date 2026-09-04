/**
 * Run-length-native multiplication for {@link HugeInt}.
 *
 * A number is handled here as a **runs array**: `[[digit, count], …]`, LSB-first,
 * every entry a `bigint` pair. Counts may be astronomically large, so nothing in
 * this module iterates digit-by-digit over a run — the cost of every routine is
 * `poly(runCount, base, log totalDigits)`.
 *
 * The core is {@link mulRepunitRuns} (`A × 111…1`), which expresses the product
 * as a sliding digit-sum window over `A` — piecewise an arithmetic progression
 * with only `O(runs(A))` breakpoints — and carry-normalizes each AP segment in
 * closed form via {@link normalizeAPSegment}. General `A × B` is the schoolbook
 * sum of `dⱼ · base^{pⱼ} · (A × R(cⱼ))` over the runs of `B`.
 *
 * The one case that cannot stay run-length compressed is a non-constant carry
 * pattern that repeats across a huge span (both operands carrying large runs of
 * comparable length) — that throws {@link BudgetExceededError}.
 *
 * @module HugeInt/multiply
 */

/**
 * @typedef {Array<[bigint, bigint]>} Runs
 *     `[digit, count]` pairs, least-significant run first.
 */

/** Thrown when a product cannot be represented within the given cell budget. */
export class BudgetExceededError extends Error {
    constructor(message = 'HugeInt.mul: product has a non-repeating span too large for run-length representation') {
        super(message)
        this.name = 'BudgetExceededError'
    }
}

/** @param {Runs} runs @returns {boolean} */
const isZeroRuns = (runs) => runs.every(([digit]) => digit === 0n)

/**
 * Appends `count` copies of `digit`, merging into the previous run when equal.
 *
 * @param {Runs} out
 * @param {bigint} digit
 * @param {bigint} count
 * @returns {void}
 */
function pushRun(out, digit, count) {
    if (count <= 0n) return
    const last = out[out.length - 1]
    if (last && last[0] === digit) last[1] += count
    else out.push([digit, count])
}

/**
 * Converts a runs array to its `bigint` value. For small numbers only — used by
 * the `bigint` fast path and by tests.
 *
 * @param {Runs} runs
 * @param {bigint} base
 * @returns {bigint}
 */
export function runsToBigInt(runs, base) {
    const repunit = (count) => (base ** count - 1n) / (base - 1n === 0n ? 1n : base - 1n)
    let value = 0n
    let power = 1n
    for (const [digit, count] of runs) {
        value += digit * (base === 2n ? (1n << count) - 1n : repunit(count)) * power
        power *= base ** count
    }
    return value
}

/**
 * Converts a non-negative `bigint` to a runs array in `base`.
 *
 * @param {bigint} value
 * @param {bigint} base
 * @returns {Runs}
 */
export function bigIntToRuns(value, base) {
    if (value < 0n) throw new RangeError('HugeInt cannot be negative')
    if (value === 0n) return [[0n, 1n]]

    const runs = []
    while (value > 0n) {
        const digit = value % base
        value /= base
        pushRun(runs, digit, 1n)
    }
    return runs
}

/**
 * Carry-normalizes one arithmetic-progression segment of a base-`base` number.
 *
 * Pre-carry, position `t` (for `0 ≤ t < length`) holds `v + m·t`. The emitted
 * digits satisfy `total(t) = v + m·t + γ(t)`, `digit(t) = total(t) mod base`,
 * `γ(t+1) = ⌊total(t) / base⌋`, with `γ(0) = carryIn`. `v + m·t` is assumed
 * `≥ 0` across the segment (true for a genuine digit-sum window).
 *
 * - `m = 0`: the carry converges to a fixed point in `O(log v)` steps → the
 *   segment is `O(log v)` cells plus one run.
 * - `m ≠ 0`: the reduced state `h(t) = (base−1)·γ(t) − m·t` advances by `−m`
 *   modulo `base−1` and stays bounded, so it is eventually periodic with period
 *   `λ ≤ base−1`; `digit(t) = (v − h(t)) mod base`. The segment is a short
 *   transient plus a `λ`-digit pattern repeated `Q` times. A single-digit
 *   pattern collapses to one run; otherwise emitting `Q·λ` cells that would
 *   exceed `budgetLeft()` throws {@link BudgetExceededError}.
 *
 * @param {(digit: bigint, count: bigint) => void} pushDigit
 * @param {() => bigint} budgetLeft   remaining cell budget
 * @param {bigint} v                  value at `t = 0`
 * @param {bigint} m                  slope (`|m|` bounded by `base−1` from a repunit product)
 * @param {bigint} length            segment length (may be enormous)
 * @param {bigint} carryIn           incoming carry `γ(0)`
 * @param {bigint} base
 * @returns {{ carryOut: bigint }}
 */
export function normalizeAPSegment(pushDigit, budgetLeft, v, m, length, carryIn, base) {
    if (length <= 0n) return { carryOut: carryIn }

    const baseMinusOne = base - 1n
    let gamma = carryIn

    if (m === 0n) {
        let t = 0n
        while (t < length) {
            const total = v + gamma
            const digit = total % base
            const nextGamma = total / base
            if (nextGamma === gamma) {
                pushDigit(digit, length - t)
                return { carryOut: gamma }
            }
            pushDigit(digit, 1n)
            gamma = nextGamma
            t += 1n
        }
        return { carryOut: gamma }
    }

    // m != 0: simulate, recording h at each step, until h repeats or the segment ends.
    const seenAt = new Map()
    const digitSeq = []
    const hSeq = []
    const simCap = 8n * base + 512n
    let cycleStart = -1
    let t = 0n

    while (t < length && t < simCap) {
        const h = baseMinusOne * gamma - m * t
        const key = h.toString()
        const prev = seenAt.get(key)
        if (prev !== undefined) {
            cycleStart = prev
            break
        }
        seenAt.set(key, digitSeq.length)
        hSeq.push(h)

        const total = v + m * t + gamma
        if (total < 0n) throw new Error('HugeInt internal: negative digit-sum in AP normalization')
        digitSeq.push(total % base)
        gamma = total / base
        t += 1n
    }

    if (cycleStart < 0) {
        if (t >= simCap && t < length) {
            throw new Error('HugeInt internal: AP carry state failed to cycle')
        }
        for (const digit of digitSeq) pushDigit(digit, 1n)
        return { carryOut: gamma }
    }

    for (let k = 0; k < cycleStart; k++) pushDigit(digitSeq[k], 1n)

    const pattern = digitSeq.slice(cycleStart)
    const lambda = BigInt(pattern.length)
    const stepsToCover = length - BigInt(cycleStart)
    const reps = stepsToCover / lambda
    const leftover = stepsToCover % lambda

    if (pattern.every((digit) => digit === pattern[0])) {
        pushDigit(pattern[0], reps * lambda + leftover)
    } else {
        if (reps * lambda > budgetLeft()) throw new BudgetExceededError()
        for (let r = 0n; r < reps; r++) {
            for (const digit of pattern) pushDigit(digit, 1n)
        }
        for (let k = 0n; k < leftover; k++) pushDigit(pattern[Number(k)], 1n)
    }

    // h is periodic ⇒ h(length) = h(cycleStart + leftover); γ = (h + m·length) / (base−1)
    const hEnd = hSeq[cycleStart + Number(leftover)]
    return { carryOut: (hEnd + m * length) / baseMinusOne }
}

/**
 * Multiplies a runs array by a single digit `d` (`0 ≤ d < base`).
 *
 * Within a run the carry sequence `c ↦ ⌊(x·d + c) / base⌋` is monotonic and
 * bounded by `d`, so it reaches a fixed point in `≤ d` steps and the rest of the
 * run shares one output digit.
 *
 * @param {Runs} runs
 * @param {bigint} d
 * @param {bigint} base
 * @returns {Runs}
 */
export function mulSmallRuns(runs, d, base) {
    if (d === 0n || isZeroRuns(runs)) return [[0n, 1n]]
    if (d === 1n) return runs.map(([digit, count]) => [digit, count])

    const out = []
    let carry = 0n

    for (const [x, count] of runs) {
        let remaining = count
        while (remaining > 0n) {
            const total = x * d + carry
            const digit = total % base
            const nextCarry = total / base
            if (nextCarry === carry) {
                pushRun(out, digit, remaining)
                remaining = 0n
            } else {
                pushRun(out, digit, 1n)
                carry = nextCarry
                remaining -= 1n
            }
        }
    }
    while (carry > 0n) {
        pushRun(out, carry % base, 1n)
        carry /= base
    }
    return out.length ? out : [[0n, 1n]]
}

/**
 * Adds two runs arrays. The carry of a two-operand addition is `0` or `1` and
 * stabilizes within one step of any constant-digit stretch.
 *
 * @param {Runs} xRuns
 * @param {Runs} yRuns
 * @param {bigint} base
 * @param {bigint} [maxCells]
 * @returns {Runs}
 */
export function addRuns(xRuns, yRuns, base, maxCells) {
    const out = []
    const push = (digit, count) => {
        if (count <= 0n) return
        const last = out[out.length - 1]
        if (last && last[0] === digit) last[1] += count
        else {
            out.push([digit, count])
            if (maxCells !== undefined && BigInt(out.length) > maxCells) throw new BudgetExceededError()
        }
    }

    let xi = 0
    let yi = 0
    let xLeft = xRuns.length ? xRuns[0][1] : 0n
    let yLeft = yRuns.length ? yRuns[0][1] : 0n
    let carry = 0n

    while (xi < xRuns.length || yi < yRuns.length) {
        const xd = xi < xRuns.length ? xRuns[xi][0] : 0n
        const yd = yi < yRuns.length ? yRuns[yi][0] : 0n

        let seg
        if (xi < xRuns.length && yi < yRuns.length) seg = xLeft < yLeft ? xLeft : yLeft
        else if (xi < xRuns.length) seg = xLeft
        else seg = yLeft

        let remaining = seg
        while (remaining > 0n) {
            const total = xd + yd + carry
            const digit = total % base
            const nextCarry = total / base
            if (nextCarry === carry) {
                push(digit, remaining)
                remaining = 0n
            } else {
                push(digit, 1n)
                carry = nextCarry
                remaining -= 1n
            }
        }

        if (xi < xRuns.length) {
            xLeft -= seg
            if (xLeft === 0n && ++xi < xRuns.length) xLeft = xRuns[xi][1]
        }
        if (yi < yRuns.length) {
            yLeft -= seg
            if (yLeft === 0n && ++yi < yRuns.length) yLeft = yRuns[yi][1]
        }
    }
    while (carry > 0n) {
        push(carry % base, 1n)
        carry /= base
    }
    return out.length ? out : [[0n, 1n]]
}

/**
 * Multiplies a runs array by the repunit `R(c) = 111…1` (`c` ones in `base`),
 * i.e. `A · (baseᶜ − 1)/(base − 1)`.
 *
 * Output position `j` holds, pre-carry, the width-`c` digit-sum window
 * `S(j) = PS(j+1) − PS(j+1−c)` where `PS` is the digit prefix-sum of `A`. `S` is
 * piecewise arithmetic with breakpoints only where `j` or `j−c` meets a run
 * boundary of `A` (`O(runs(A))` of them); each segment is normalized by
 * {@link normalizeAPSegment}.
 *
 * @param {Runs} aRuns
 * @param {bigint} c        repunit length (`≥ 1`)
 * @param {bigint} base
 * @param {bigint} maxCells cell budget for the result
 * @returns {Runs}
 */
export function mulRepunitRuns(aRuns, c, base, maxCells) {
    if (c <= 0n || isZeroRuns(aRuns)) return [[0n, 1n]]

    const k = aRuns.length
    const runStart = new Array(k)
    const runPrefixSum = new Array(k)
    let pos = 0n
    let sum = 0n
    for (let i = 0; i < k; i++) {
        runStart[i] = pos
        runPrefixSum[i] = sum
        pos += aRuns[i][1]
        sum += aRuns[i][0] * aRuns[i][1]
    }
    const nA = pos
    const digitSum = sum

    // sum of the first `q` digits of A (q clamped to [0, nA])
    const prefixSum = (q) => {
        if (q <= 0n) return 0n
        if (q >= nA) return digitSum
        let lo = 0
        let hi = k - 1
        let r = 0
        while (lo <= hi) {
            const mid = (lo + hi) >> 1
            if (runStart[mid] < q) {
                r = mid
                lo = mid + 1
            } else hi = mid - 1
        }
        return runPrefixSum[r] + (q - runStart[r]) * aRuns[r][0]
    }

    // digit of A at position `p`, or 0 outside [0, nA)
    const digitAt = (p) => {
        if (p < 0n || p >= nA) return 0n
        let lo = 0
        let hi = k - 1
        let r = 0
        while (lo <= hi) {
            const mid = (lo + hi) >> 1
            if (runStart[mid] <= p) {
                r = mid
                lo = mid + 1
            } else hi = mid - 1
        }
        return aRuns[r][0]
    }

    const windowSum = (j) => prefixSum(j + 1n) - prefixSum(j + 1n - c)

    const breakpoints = new Set([0n, c, nA, nA + c])
    for (let i = 1; i < k; i++) {
        breakpoints.add(runStart[i])
        breakpoints.add(runStart[i] + c)
    }
    const points = [...breakpoints]
        .filter((p) => p >= 0n && p <= nA + c)
        .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))

    const out = []
    const pushDigit = (digit, count) => {
        if (count <= 0n) return
        const last = out[out.length - 1]
        if (last && last[0] === digit) last[1] += count
        else {
            out.push([digit, count])
            if (BigInt(out.length) > maxCells) throw new BudgetExceededError()
        }
    }
    const budgetLeft = () => maxCells - BigInt(out.length)

    let carry = 0n
    for (let s = 0; s + 1 < points.length; s++) {
        const j0 = points[s]
        const length = points[s + 1] - j0
        if (length <= 0n) continue
        const result = normalizeAPSegment(
            pushDigit,
            budgetLeft,
            windowSum(j0),
            digitAt(j0) - digitAt(j0 - c),
            length,
            carry,
            base,
        )
        carry = result.carryOut
    }
    while (carry > 0n) {
        pushDigit(carry % base, 1n)
        carry /= base
    }
    return out.length ? out : [[0n, 1n]]
}

/**
 * Multiplies two runs arrays: `A × B = Σⱼ dⱼ · base^{pⱼ} · (A × R(cⱼ))` over the
 * runs `(dⱼ, cⱼ)` of `B` at offsets `pⱼ`.
 *
 * @param {Runs} aRuns
 * @param {Runs} bRuns
 * @param {bigint} base
 * @param {{ maxCells?: bigint }} [options]
 * @returns {Runs}
 */
export function mulRuns(aRuns, bRuns, base, { maxCells = 2_000_000n } = {}) {
    if (isZeroRuns(aRuns) || isZeroRuns(bRuns)) return [[0n, 1n]]

    let acc = [[0n, 1n]]
    let offset = 0n
    for (const [digit, count] of bRuns) {
        if (digit !== 0n) {
            let term = mulRepunitRuns(aRuns, count, base, maxCells)
            if (digit !== 1n) term = mulSmallRuns(term, digit, base)
            if (offset > 0n) term = [[0n, offset], ...term]
            acc = addRuns(acc, term, base, maxCells)
        }
        offset += count
    }
    return acc
}
