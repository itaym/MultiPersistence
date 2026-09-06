/**
 * Digit-group-native multiplication for {@link HugeInt}.
 *
 * A number is handled here as {@link DigitGroups}: `[[digit, repeatCount], …]`,
 * least-significant group first, every entry a `bigint` pair. Repeat counts may
 * be astronomically large, so nothing in this module walks a group digit by
 * digit — the cost of every routine is `poly(groupCount, base, log totalDigits)`.
 *
 * The core is {@link multiplyGroupsByRepunit} (`A × 111…1`), which expresses the
 * product as a sliding digit-sum window over `A` — piecewise an arithmetic
 * progression with only `O(groups(A))` breakpoints — and carry-normalizes each
 * segment in closed form via {@link normalizeAPSegment}. General `A × B` is the
 * schoolbook sum of `digitⱼ · base^{offsetⱼ} · (A × repunit(onesⱼ))` over the
 * groups of `B`.
 *
 * The one case that cannot stay group-compressed is a non-constant carry pattern
 * that repeats across a huge span (both operands carrying large groups of
 * comparable length) — that throws {@link BudgetExceededError}.
 *
 * @module HugeInt/multiply
 */

/**
 * @typedef {[bigint, bigint]} DigitGroup
 *     One digit and how many times it repeats in a row: `[digit, repeatCount]`.
 * @typedef {DigitGroup[]} DigitGroups
 *     A whole number as digit groups, least-significant group first.
 */

/** Thrown when a product cannot be represented within the given cell budget. */
export class BudgetExceededError extends Error {
    constructor(message = 'HugeInt.multiply: product has a non-repeating span too large for digit-group representation') {
        super(message)
        this.name = 'BudgetExceededError'
    }
}

/** @param {DigitGroups} groups @returns {boolean} */
const isZeroGroups = (groups) => groups.every(([digit]) => digit === 0n)

/**
 * Appends `repeatCount` copies of `digit`, merging into the previous group when
 * equal.
 *
 * @param {DigitGroups} out
 * @param {bigint} digit
 * @param {bigint} repeatCount
 * @returns {void}
 */
function pushGroup(out, digit, repeatCount) {
    if (repeatCount <= 0n) return
    const last = out[out.length - 1]
    if (last && last[0] === digit) last[1] += repeatCount
    else out.push([digit, repeatCount])
}

/**
 * Converts digit groups to their `bigint` value. For small numbers only — used
 * by the `bigint` fast path and by tests.
 *
 * @param {DigitGroups} groups
 * @param {bigint} base
 * @returns {bigint}
 */
export function groupsToBigInt(groups, base) {
    const repunit = (onesCount) => (base ** onesCount - 1n) / (base - 1n === 0n ? 1n : base - 1n)
    let value = 0n
    let power = 1n
    for (const [digit, repeatCount] of groups) {
        value += digit * (base === 2n ? (1n << repeatCount) - 1n : repunit(repeatCount)) * power
        power *= base ** repeatCount
    }
    return value
}

/**
 * Converts a non-negative `bigint` to digit groups in `base`.
 *
 * @param {bigint} value
 * @param {bigint} base
 * @returns {DigitGroups}
 */
export function bigIntToGroups(value, base) {
    if (value < 0n) throw new RangeError('HugeInt cannot be negative')
    if (value === 0n) return [[0n, 1n]]

    const groups = []
    while (value > 0n) {
        const digit = value % base
        value /= base
        pushGroup(groups, digit, 1n)
    }
    return groups
}

/**
 * Carry-normalizes one arithmetic-progression segment of a base-`base` number.
 *
 * Pre-carry, position `step` (for `0 ≤ step < length`) holds
 * `startValue + slope·step`. The emitted digits satisfy
 * `total = startValue + slope·step + γ`, `digit = total mod base`,
 * `γ_next = ⌊total / base⌋`, with `γ(0) = carryIn`. `startValue + slope·step` is
 * assumed `≥ 0` across the segment (true for a genuine digit-sum window).
 *
 * - `slope = 0`: the carry converges to a fixed point in `O(log startValue)`
 *   steps → the segment is `O(log startValue)` cells plus one group.
 * - `slope ≠ 0`: the reduced state `h(step) = (base−1)·γ − slope·step` advances
 *   by `−slope` modulo `base−1` and stays bounded, so it is eventually periodic
 *   with period `λ ≤ base−1`; `digit = (startValue − h) mod base`. The segment is
 *   a short transient plus a `λ`-digit pattern repeated `Q` times. A single-digit
 *   pattern collapses to one group; otherwise emitting `Q·λ` cells that would
 *   exceed `budgetLeft()` throws {@link BudgetExceededError}.
 *
 * @param {(digit: bigint, repeatCount: bigint) => void} pushDigit
 * @param {() => bigint} budgetLeft   remaining cell budget
 * @param {bigint} startValue         value at `step = 0`
 * @param {bigint} slope              per-step delta (`|slope|` bounded by `base−1` from a repunit product)
 * @param {bigint} length             segment length (may be enormous)
 * @param {bigint} carryIn            incoming carry `γ(0)`
 * @param {bigint} base
 * @returns {{ carryOut: bigint }}
 */
export function normalizeAPSegment(pushDigit, budgetLeft, startValue, slope, length, carryIn, base) {
    if (length <= 0n) return { carryOut: carryIn }

    const baseMinusOne = base - 1n
    let gamma = carryIn

    if (slope === 0n) {
        let step = 0n
        while (step < length) {
            const total = startValue + gamma
            const digit = total % base
            const nextGamma = total / base
            if (nextGamma === gamma) {
                pushDigit(digit, length - step)
                return { carryOut: gamma }
            }
            pushDigit(digit, 1n)
            gamma = nextGamma
            step += 1n
        }
        return { carryOut: gamma }
    }

    // slope != 0: simulate, recording h at each step, until h repeats or the segment ends.
    const seenAt = new Map()
    const digitSeq = []
    const hSeq = []
    const simCap = 8n * base + 512n
    let cycleStart = -1
    let step = 0n

    while (step < length && step < simCap) {
        const h = baseMinusOne * gamma - slope * step
        const key = h.toString()
        const prev = seenAt.get(key)
        if (prev !== undefined) {
            cycleStart = prev
            break
        }
        seenAt.set(key, digitSeq.length)
        hSeq.push(h)

        const total = startValue + slope * step + gamma
        if (total < 0n) throw new Error('HugeInt internal: negative digit-sum in AP normalization')
        digitSeq.push(total % base)
        gamma = total / base
        step += 1n
    }

    if (cycleStart < 0) {
        if (step >= simCap && step < length) {
            throw new Error('HugeInt internal: AP carry state failed to cycle')
        }
        for (const digit of digitSeq) pushDigit(digit, 1n)
        return { carryOut: gamma }
    }

    for (let i = 0; i < cycleStart; i++) pushDigit(digitSeq[i], 1n)

    const pattern = digitSeq.slice(cycleStart)
    const patternLength = BigInt(pattern.length)
    const stepsToCover = length - BigInt(cycleStart)
    const repeats = stepsToCover / patternLength
    const leftover = stepsToCover % patternLength

    if (pattern.every((digit) => digit === pattern[0])) {
        pushDigit(pattern[0], repeats * patternLength + leftover)
    } else {
        if (repeats * patternLength > budgetLeft()) throw new BudgetExceededError()
        for (let rep = 0n; rep < repeats; rep++) {
            for (const digit of pattern) pushDigit(digit, 1n)
        }
        for (let i = 0n; i < leftover; i++) pushDigit(pattern[Number(i)], 1n)
    }

    // h is periodic ⇒ h(length) = h(cycleStart + leftover); γ = (h + slope·length) / (base−1)
    const hEnd = hSeq[cycleStart + Number(leftover)]
    return { carryOut: (hEnd + slope * length) / baseMinusOne }
}

/**
 * Multiplies digit groups by a single digit (`0 ≤ digit < base`).
 *
 * Within a group the carry sequence `c ↦ ⌊(groupDigit·digit + c) / base⌋` is
 * monotonic and bounded by `digit`, so it reaches a fixed point in `≤ digit`
 * steps and the rest of the group shares one output digit.
 *
 * @param {DigitGroups} groups
 * @param {bigint} digit
 * @param {bigint} base
 * @returns {DigitGroups}
 */
export function multiplyGroupsByDigit(groups, digit, base) {
    if (digit === 0n || isZeroGroups(groups)) return [[0n, 1n]]
    if (digit === 1n) return groups.map(([groupDigit, repeatCount]) => [groupDigit, repeatCount])

    const out = []
    let carry = 0n

    for (const [groupDigit, repeatCount] of groups) {
        let remaining = repeatCount
        while (remaining > 0n) {
            const total = groupDigit * digit + carry
            const outDigit = total % base
            const nextCarry = total / base
            if (nextCarry === carry) {
                pushGroup(out, outDigit, remaining)
                remaining = 0n
            } else {
                pushGroup(out, outDigit, 1n)
                carry = nextCarry
                remaining -= 1n
            }
        }
    }
    while (carry > 0n) {
        pushGroup(out, carry % base, 1n)
        carry /= base
    }
    return out.length ? out : [[0n, 1n]]
}

/**
 * Adds two digit-group numbers. The carry of a two-operand addition is `0` or
 * `1` and stabilizes within one step of any constant-digit stretch.
 *
 * @param {DigitGroups} leftGroups
 * @param {DigitGroups} rightGroups
 * @param {bigint} base
 * @param {bigint} [maxCells]
 * @returns {DigitGroups}
 */
export function addGroups(leftGroups, rightGroups, base, maxCells) {
    const out = []
    const push = (digit, repeatCount) => {
        if (repeatCount <= 0n) return
        const last = out[out.length - 1]
        if (last && last[0] === digit) last[1] += repeatCount
        else {
            out.push([digit, repeatCount])
            if (maxCells !== undefined && BigInt(out.length) > maxCells) throw new BudgetExceededError()
        }
    }

    let leftIndex = 0
    let rightIndex = 0
    let leftRemaining = leftGroups.length ? leftGroups[0][1] : 0n
    let rightRemaining = rightGroups.length ? rightGroups[0][1] : 0n
    let carry = 0n

    while (leftIndex < leftGroups.length || rightIndex < rightGroups.length) {
        const leftDigit = leftIndex < leftGroups.length ? leftGroups[leftIndex][0] : 0n
        const rightDigit = rightIndex < rightGroups.length ? rightGroups[rightIndex][0] : 0n

        let span
        if (leftIndex < leftGroups.length && rightIndex < rightGroups.length) {
            span = leftRemaining < rightRemaining ? leftRemaining : rightRemaining
        } else if (leftIndex < leftGroups.length) span = leftRemaining
        else span = rightRemaining

        let remaining = span
        while (remaining > 0n) {
            const total = leftDigit + rightDigit + carry
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

        if (leftIndex < leftGroups.length) {
            leftRemaining -= span
            if (leftRemaining === 0n && ++leftIndex < leftGroups.length) leftRemaining = leftGroups[leftIndex][1]
        }
        if (rightIndex < rightGroups.length) {
            rightRemaining -= span
            if (rightRemaining === 0n && ++rightIndex < rightGroups.length) rightRemaining = rightGroups[rightIndex][1]
        }
    }
    while (carry > 0n) {
        push(carry % base, 1n)
        carry /= base
    }
    return out.length ? out : [[0n, 1n]]
}

/**
 * Multiplies digit groups by the repunit `111…1` (`onesCount` ones in `base`),
 * i.e. `A · (base^onesCount − 1)/(base − 1)`.
 *
 * Output position `j` holds, pre-carry, the width-`onesCount` digit-sum window
 * `S(j) = prefixSum(j+1) − prefixSum(j+1−onesCount)` over the digits of `A`. `S`
 * is piecewise arithmetic with breakpoints only where `j` or `j−onesCount` meets
 * a group boundary of `A` (`O(groups(A))` of them); each segment is normalized
 * by {@link normalizeAPSegment}.
 *
 * @param {DigitGroups} groups
 * @param {bigint} onesCount   number of ones in the repunit (`≥ 1`)
 * @param {bigint} base
 * @param {bigint} maxCells    cell budget for the result
 * @returns {DigitGroups}
 */
export function multiplyGroupsByRepunit(groups, onesCount, base, maxCells) {
    if (onesCount <= 0n || isZeroGroups(groups)) return [[0n, 1n]]

    const groupCount = groups.length
    const groupStart = new Array(groupCount)
    const groupPrefixSum = new Array(groupCount)
    let position = 0n
    let sum = 0n
    for (let i = 0; i < groupCount; i++) {
        groupStart[i] = position
        groupPrefixSum[i] = sum
        position += groups[i][1]
        sum += groups[i][0] * groups[i][1]
    }
    const totalDigits = position
    const digitSum = sum

    // sum of the first `count` digits of A (clamped to [0, totalDigits])
    const prefixSum = (count) => {
        if (count <= 0n) return 0n
        if (count >= totalDigits) return digitSum
        let lo = 0
        let hi = groupCount - 1
        let found = 0
        while (lo <= hi) {
            const mid = (lo + hi) >> 1
            if (groupStart[mid] < count) {
                found = mid
                lo = mid + 1
            } else hi = mid - 1
        }
        return groupPrefixSum[found] + (count - groupStart[found]) * groups[found][0]
    }

    // digit of A at position `at`, or 0 outside [0, totalDigits)
    const digitAt = (at) => {
        if (at < 0n || at >= totalDigits) return 0n
        let lo = 0
        let hi = groupCount - 1
        let found = 0
        while (lo <= hi) {
            const mid = (lo + hi) >> 1
            if (groupStart[mid] <= at) {
                found = mid
                lo = mid + 1
            } else hi = mid - 1
        }
        return groups[found][0]
    }

    const windowSum = (j) => prefixSum(j + 1n) - prefixSum(j + 1n - onesCount)

    const breakpointSet = new Set([0n, onesCount, totalDigits, totalDigits + onesCount])
    for (let i = 1; i < groupCount; i++) {
        breakpointSet.add(groupStart[i])
        breakpointSet.add(groupStart[i] + onesCount)
    }
    const breakpoints = [...breakpointSet]
        .filter((point) => point >= 0n && point <= totalDigits + onesCount)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

    const out = []
    const pushDigit = (digit, repeatCount) => {
        if (repeatCount <= 0n) return
        const last = out[out.length - 1]
        if (last && last[0] === digit) last[1] += repeatCount
        else {
            out.push([digit, repeatCount])
            if (BigInt(out.length) > maxCells) throw new BudgetExceededError()
        }
    }
    const budgetLeft = () => maxCells - BigInt(out.length)

    let carry = 0n
    for (let i = 0; i + 1 < breakpoints.length; i++) {
        const segmentStart = breakpoints[i]
        const length = breakpoints[i + 1] - segmentStart
        if (length <= 0n) continue
        const result = normalizeAPSegment(
            pushDigit,
            budgetLeft,
            windowSum(segmentStart),
            digitAt(segmentStart) - digitAt(segmentStart - onesCount),
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
 * Multiplies two digit-group numbers:
 * `A × B = Σⱼ digitⱼ · base^{offsetⱼ} · (A × repunit(onesⱼ))` over the groups
 * `(digitⱼ, onesⱼ)` of `B` at offsets `offsetⱼ`.
 *
 * @param {DigitGroups} leftGroups
 * @param {DigitGroups} rightGroups
 * @param {bigint} base
 * @param {{ maxCells?: bigint }} [options]
 * @returns {DigitGroups}
 */
export function multiplyGroups(leftGroups, rightGroups, base, { maxCells = 2_000_000n } = {}) {
    if (isZeroGroups(leftGroups) || isZeroGroups(rightGroups)) return [[0n, 1n]]

    let acc = [[0n, 1n]]
    let offset = 0n
    for (const [digit, repeatCount] of rightGroups) {
        if (digit !== 0n) {
            let term = multiplyGroupsByRepunit(leftGroups, repeatCount, base, maxCells)
            if (digit !== 1n) term = multiplyGroupsByDigit(term, digit, base)
            if (offset > 0n) term = [[0n, offset], ...term]
            acc = addGroups(acc, term, base, maxCells)
        }
        offset += repeatCount
    }
    return acc
}
