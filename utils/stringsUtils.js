/**
 * Sanitizes a string for terminal‑safe output.
 *
 * Replaces control, zero‑width, and bidi characters with 'X'.
 *
 * @param {string} str
 *     Input string.
 *
 * @returns {string}
 *     Sanitized string.
 */
export const sanitize = (str) => {
    return str
        // ASCII control chars + DEL + C1 control chars
        .replace(/[\x00-\x1F\x7F-\x9F]/g, 'X')
        // Zero‑width characters
        .replace(/[\u200B-\u200D]/g, 'X')
        // Bidirectional control characters
        .replace(/[\u202A-\u202E]/g, 'X')
}

/**
 * Truncates a string by keeping start and end segments with '...' in the middle.
 *
 * @param {string} str
 *     Original string.
 *
 * @param {number} [max=Number.MAX_SAFE_INTEGER]
 *     Maximum allowed length.
 *
 * @returns {string}
 *     Truncated or original string.
 */
export const fromMiddleStringMaxLength = (str, max = Number.MAX_SAFE_INTEGER) => {
    if (max < 4 || str.length <= max) {
        return str
    }

    const available = max - 3
    const leftLen = Math.ceil(available / 2)
    const rightLen = Math.floor(available / 2)

    const left = str.substring(0, leftLen)
    const right = str.substring(str.length - rightLen)

    return left + '...' + right
}

/**
 * Computes slicing ranges for three‑part truncation.
 *
 * @param {string} str
 *     Original string.
 *
 * @param {number} [maxLen=Number.MAX_SAFE_INTEGER]
 *     Maximum allowed length.
 *
 * @returns {object}
 *     Range information.
 */
export const computeThreePartRanges = (str, maxLen = Number.MAX_SAFE_INTEGER) => {
    const n = str.length

    if (n < 3) {
        return {
            mode: 'short',
            map: '--'
        }
    }

    if (n <= maxLen) {
        return {
            mode: 'full',
            left: { start: 0, end: n - 1 }
        }
    }

    const available = maxLen - 6
    const base = Math.floor(available / 3)
    const remainder = available % 3

    const partLenLeft = base + (remainder > 0 ? 1 : 0)
    const partLenMiddle = base + (remainder > 1 ? 1 : 0)
    const partLenRight = base

    const leftStart = 0
    const leftEnd = partLenLeft - 1

    const midStart = Math.floor((n - partLenMiddle) / 2)
    const midEnd = midStart + partLenMiddle - 1

    const rightStart = n - partLenRight
    const rightEnd = n - 1

    return {
        mode: 'three',
        left:   { start: leftStart, end: leftEnd },
        middle: { start: midStart, end: midEnd },
        right:  { start: rightStart, end: rightEnd }
    }
}

/**
 * Produces a truncated string using three‑part slicing.
 *
 * @param {string} str
 *     Original string.
 *
 * @param {number} [maxLen=Number.MAX_SAFE_INTEGER]
 *     Maximum allowed length.
 *
 * @returns {string}
 *     Truncated or original string.
 */
export const fromMiddleNumberMaxLength = (str, maxLen = Number.MAX_SAFE_INTEGER) => {
    const ranges = computeThreePartRanges(str, maxLen)

    if (ranges.mode === 'short') {
        return str
    }

    if (ranges.mode === 'full') {
        return str
    }

    const left = str.slice(ranges.left.start, ranges.left.end + 1)
    const middle = str.slice(ranges.middle.start, ranges.middle.end + 1)
    const right = str.slice(ranges.right.start, ranges.right.end + 1)

    return `${left}...${middle}...${right}`
}

/**
 * Creates a visual index map for three‑part truncation.
 *
 * @param {string} str
 *     Original string.
 *
 * @param {number} [maxLen=Number.MAX_SAFE_INTEGER]
 *     Maximum allowed length.
 *
 * @returns {string}
 *     Visual index map.
 */
export const fromMiddleNumberLocations = (str, maxLen = Number.MAX_SAFE_INTEGER) => {
    const ranges = computeThreePartRanges(str, maxLen)

    if (ranges.mode === 'short') {
        return '--'
    }

    if (ranges.mode === 'full') {
        const s = ranges.left.start + 1
        const e = ranges.left.end + 1
        const segLen = e - s + 1
        const dashCount = segLen - (String(s).length + String(e).length)
        return `${s}${'-'.repeat(dashCount)}${e}`
    }

    const makeSegment = (range) => {
        const s = range.start + 1
        const e = range.end + 1
        const segLen = e - s + 1
        const dashCount = segLen - (String(s).length + String(e).length)
        return `${s}${'-'.repeat(dashCount)}${e}`
    }

    const leftMap = makeSegment(ranges.left)
    const midMap = makeSegment(ranges.middle)
    const rightMap = makeSegment(ranges.right)

    return `${leftMap}...${midMap}...${rightMap}`
}
