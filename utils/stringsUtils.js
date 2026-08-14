/**
 * Sanitize a string for safe use in terminal output (e.g., console.log).
 *
 * This function removes characters that can disrupt terminal behavior,
 * including:
 *
 *   - ASCII control characters (0–31)
 *   - DEL (127)
 *   - C1 control characters (128–159)
 *   - Zero‑width characters (U+200B–U+200D)
 *   - Bidirectional control marks (U+202A–U+202E)
 *
 * These characters may:
 *   - break lines
 *   - move the cursor
 *   - overwrite previous characters
 *   - trigger beeps
 *   - inject ANSI escape sequences
 *   - visually reorder text (bidi spoofing)
 *   - hide content (zero‑width)
 *
 * All sanitized characters are replaced with the literal 'X'.
 *
 * @param {string} str
 *     The input string to sanitize for terminal‑safe logging.
 *
 * @returns {string}
 *     A sanitized version of the string, safe for console.log.
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
 * Truncates a string by keeping characters from the start and end,
 * inserting '...' in the middle. If the string fits within `max`,
 * it is returned unchanged.
 *
 * @param {string} str - The original string
 * @param {number} [max=Number.MAX_SAFE_INTEGER] - Maximum allowed length
 * @returns {string} The truncated string or the original if no truncation is needed
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
 * Computes index ranges for three-part truncation of a string.
 * Returns one of three modes:
 * - 'short': string too short to split
 * - 'full': string fits entirely within maxLen
 * - 'three': three-part slicing required
 *
 * @param {string} str - The original string
 * @param {number} [maxLen=Number.MAX_SAFE_INTEGER] - Maximum allowed length
 * @returns {object} Range information describing how the string should be sliced
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
 * Produces a truncated string using three-part slicing:
 * left...middle...right
 *
 * If the string is short or fits within maxLen, it is returned unchanged.
 *
 * @param {string} str - The original string
 * @param {number} [maxLen=Number.MAX_SAFE_INTEGER] - Maximum allowed length
 * @returns {string} The truncated string
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
 * Creates a visual index map string showing the exact character ranges used
 * in the three-part truncation. Each segment's total width matches the number
 * of characters it represents.
 *
 * Example:
 *   1------------------------------------------45...63----------------------------------------107...127......................................170
 *
 * @param {string} str - The original string
 * @param {number} [maxLen=Number.MAX_SAFE_INTEGER] - Maximum allowed length
 * @returns {string} A visual map of index ranges
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
