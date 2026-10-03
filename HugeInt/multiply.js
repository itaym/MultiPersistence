/** Thrown when a product needs more digit groups than the cell budget allows. */
export class BudgetExceededError extends Error {
    /**
     * @param {string} [message]
     */
    constructor(
        message = 'HugeInt.multiply: product has a non-repeating span too large for digit-group representation',
    ) {
        super(message)
        this.name = 'BudgetExceededError'
    }
}

/**
 * @param {DigitGroups} groups
 * @returns {boolean} whether every digit is 0
 */
const isZeroGroups = groups => groups.every(([digit]) => digit === 0n)

/**
 * Appends a run of `repeatCount` × `digit`, merging with an equal last group.
 *
 * @param {bigint} digit
 * @param {DigitGroups} out
 * @param {bigint} repeatCount
 * @returns {void}
 */
const pushGroup = (digit, out, repeatCount) => {
    if (repeatCount <= 0n) return
    const last = out[out.length - 1]
    if (last && last[0] === digit) last[1] += repeatCount
    else out.push([digit, repeatCount])
}

/**
 * Value of `groups` read in `base`.
 *
 * @param {bigint} base
 * @param {DigitGroups} groups
 * @returns {bigint}
 */
export const groupsToBigInt = (base, groups) => {
    /**
     * @param {bigint} onesCount
     * @returns {bigint} `onesCount` ones in `base`
     */
    const repunit = onesCount => (base ** onesCount - 1n) / (base - 1n === 0n ? 1n : base - 1n)
    let value = 0n
    let power = 1n
    for (const [digit, repeatCount] of groups) {
        value += digit * (base === 2n ? (1n << repeatCount) - 1n : repunit(repeatCount)) * power
        power *= base ** repeatCount
    }
    return value
}

/**
 * `value` as digit groups in `base`; throws on negatives.
 *
 * @param {bigint} base
 * @param {bigint} value
 * @returns {DigitGroups}
 */
export const bigIntToGroups = (base, value) => {
    if (value < 0n) throw new RangeError('HugeInt cannot be negative')
    if (value === 0n) return [[0n, 1n]]

    const groups = []
    while (value > 0n) {
        const digit = value % base
        value /= base
        pushGroup(digit, groups, 1n)
    }
    return groups
}

/**
 * Normalizes a run whose raw digit sums form an arithmetic progression, pushing the output digits.
 *
 * @param {bigint} base
 * @param {() => bigint} budgetLeft cells still allowed
 * @param {bigint} carryIn
 * @param {bigint} length digits in the run
 * @param {(digit: bigint, repeatCount: bigint) => void} pushDigit
 * @param {bigint} slope per-digit change of the raw sum
 * @param {bigint} startValue raw sum of the first digit
 * @returns {APSegmentResult}
 */
export const normalizeAPSegment = (base, budgetLeft, carryIn, length, pushDigit, slope, startValue) => {
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

    if (pattern.every(digit => digit === pattern[0])) {
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
 * `groups × digit`.
 *
 * @param {bigint} base
 * @param {bigint} digit
 * @param {DigitGroups} groups
 * @returns {DigitGroups}
 */
export const multiplyGroupsByDigit = (base, digit, groups) => {
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
                pushGroup(outDigit, out, remaining)
                remaining = 0n
            } else {
                pushGroup(outDigit, out, 1n)
                carry = nextCarry
                remaining -= 1n
            }
        }
    }
    while (carry > 0n) {
        pushGroup(carry % base, out, 1n)
        carry /= base
    }
    return out.length ? out : [[0n, 1n]]
}

/**
 * `leftGroups + rightGroups`.
 *
 * @param {bigint} base
 * @param {DigitGroups} leftGroups
 * @param {DigitGroups} rightGroups
 * @param {bigint} [maxCells] output group budget
 * @returns {DigitGroups}
 */
export const addGroups = (base, leftGroups, rightGroups, maxCells) => {
    const out = []
    /**
     * @param {bigint} digit
     * @param {bigint} repeatCount
     * @returns {void}
     */
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
 * `groups × (onesCount ones)`, one arithmetic-progression run at a time.
 *
 * @param {bigint} base
 * @param {DigitGroups} groups
 * @param {bigint} maxCells output group budget
 * @param {bigint} onesCount
 * @returns {DigitGroups}
 */
export const multiplyGroupsByRepunit = (base, groups, maxCells, onesCount) => {
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
    /**
     * @param {bigint} count
     * @returns {bigint} sum of the lowest `count` digits
     */
    const prefixSum = count => {
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
    /**
     * @param {bigint} at
     * @returns {bigint} digit at `at`, 0 outside the number
     */
    const digitAt = at => {
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

    /**
     * @param {bigint} j
     * @returns {bigint} sum of the `onesCount` digits ending at `j`
     */
    const windowSum = j => prefixSum(j + 1n) - prefixSum(j + 1n - onesCount)

    const breakpointSet = new Set([0n, onesCount, totalDigits, totalDigits + onesCount])
    for (let i = 1; i < groupCount; i++) {
        breakpointSet.add(groupStart[i])
        breakpointSet.add(groupStart[i] + onesCount)
    }
    const breakpoints = [...breakpointSet]
        .filter(point => point >= 0n && point <= totalDigits + onesCount)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

    const out = []
    /**
     * @param {bigint} digit
     * @param {bigint} repeatCount
     * @returns {void}
     */
    const pushDigit = (digit, repeatCount) => {
        if (repeatCount <= 0n) return
        const last = out[out.length - 1]
        if (last && last[0] === digit) last[1] += repeatCount
        else {
            out.push([digit, repeatCount])
            if (BigInt(out.length) > maxCells) throw new BudgetExceededError()
        }
    }
    /** @returns {bigint} */
    const budgetLeft = () => maxCells - BigInt(out.length)

    let carry = 0n
    for (let i = 0; i + 1 < breakpoints.length; i++) {
        const segmentStart = breakpoints[i]
        const length = breakpoints[i + 1] - segmentStart
        if (length <= 0n) continue
        const result = normalizeAPSegment(
            base,
            budgetLeft,
            carry,
            length,
            pushDigit,
            digitAt(segmentStart) - digitAt(segmentStart - onesCount),
            windowSum(segmentStart),
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
 * `leftGroups × rightGroups`, summing a repunit product per right-hand group.
 *
 * @param {bigint} base
 * @param {DigitGroups} leftGroups
 * @param {DigitGroups} rightGroups
 * @param {MultiplyOptions} [options]
 * @returns {DigitGroups}
 */
export const multiplyGroups = (base, leftGroups, rightGroups, { maxCells = 2_000_000n } = {}) => {
    if (isZeroGroups(leftGroups) || isZeroGroups(rightGroups)) return [[0n, 1n]]

    let acc = [[0n, 1n]]
    let offset = 0n
    for (const [digit, repeatCount] of rightGroups) {
        if (digit !== 0n) {
            let term = multiplyGroupsByRepunit(base, leftGroups, maxCells, repeatCount)
            if (digit !== 1n) term = multiplyGroupsByDigit(base, digit, term)
            if (offset > 0n) term = [[0n, offset], ...term]
            acc = addGroups(base, acc, term, maxCells)
        }
        offset += repeatCount
    }
    return acc
}
