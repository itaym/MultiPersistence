import memorize from "./memorize.js";
/**
 * Sanitizes a string for terminal‑safe output.
 * Replaces control, zero‑width, and bidi characters with 'X'.
 *
 * @param {string} str - Input string.
 *
 * @returns {string} - Sanitized string.
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

/**
 * @typedef {Object} SegmentBounds
 * @property {number[]} segStarts - start index of each segment in source
 * @property {number[]} segLens - length of each segment
 */

/**
 * Computes the start/length for each segment when source exceeds lengthLimit.
 * Shared by truncate and truncateWithRuler.
 *
 * @param {number} sourceLength - length of the source string
 * @param {number} segments - number of chunks
 * @param {number} lengthLimit - max length of the final joined result
 * @returns {SegmentBounds}
 */
const computeSegments = (sourceLength, segments, lengthLimit) => {
    const dotsTotal = 3 * (segments - 1)
    const available = lengthLimit - dotsTotal
    const base = Math.floor(available / segments)
    const remainder = available - base * segments

    // remainder chars go to the LATER segments (confirmed: 18 then 19 for limit 40 / 2 segs)
    const segLens = []
    for (let s = 0; s < segments; s++) {
        const extra = s >= segments - remainder ? 1 : 0
        segLens.push(base + extra)
    }

    // NOTE: only segments=2 was confirmed by examples (first segment from the
    // start, last segment from the end). For segments > 2 this spaces middle
    // segments proportionally across the interior - unconfirmed assumption,
    // flag if you need different behavior here.
    const segStarts = [0]
    if (segments > 1) {
        const lastStart = sourceLength - segLens[segments - 1]
        if (segments === 2) {
            segStarts.push(lastStart)
        } else {
            const midCount = segments - 2
            const firstEnd = segLens[0]
            const interiorSpan = lastStart - firstEnd
            for (let m = 0; m < midCount; m++) {
                const frac = (m + 1) / (midCount + 1)
                const s = Math.round(firstEnd + frac * interiorSpan - segLens[1 + m] / 2)
                segStarts.push(Math.max(firstEnd, Math.min(s, lastStart - 1)))
            }
            segStarts.push(lastStart)
        }
    }

    return { segStarts, segLens }
}

/**
 * Builds the dash/number ruler map for a single segment [segStart, segStart+segLen).
 * Pure function - safe to memoize by (rank, segStart, segLen).
 *
 * @param {(number|null)[]} rank - rtl running count of set-chars per index, null if not a set char
 * @param {number} width - digit width for padding rank numbers
 * @param {number} segStart - segment start index in source
 * @param {number} segLen - segment length
 * @returns {string} ruler map string of length segLen
 */
const buildSegmentMap = (rank, width, segStart, segLen) => {
    const buf = new Array(segLen).fill('-')

    let leftIdx = -1, rightIdx = -1
    for (let i = segStart; i < segStart + segLen; i++) {
        if (rank[i] !== null) { leftIdx = i; break }
    }
    for (let i = segStart + segLen - 1; i >= segStart; i--) {
        if (rank[i] !== null) { rightIdx = i; break }
    }
    if (leftIdx === -1) return buf.join('') // no set chars at all in this segment

    const sameChar = leftIdx === rightIdx
    const leftStr = String(rank[leftIdx]).padStart(width, '0')
    const rightStr = String(rank[rightIdx]).padStart(width, '0')

    if (sameChar) {
        // only one set-char in this segment: place the number at its own index
        const start = leftIdx - segStart
        for (let k = 0; k < width; k++) {
            const pos = start + k
            if (pos >= 0 && pos < segLen) buf[pos] = leftStr[k]
        }
        return buf.join('')
    }

    // align numbers to the SEGMENT's own edges (the nearest set-char is only
    // used to compute the rank VALUE, e.g. when a comma sits at the boundary)
    const leftStart = 0
    const leftEnd = width - 1
    const rightStart = segLen - width

    // ambiguity guard: if the two numbers would touch (no dash between them)
    // they'd read as one merged number - blank both out instead
    const touching = rightStart <= leftEnd + 1
    if (touching) return buf.join('')

    for (let k = 0; k < width; k++) {
        const pos = leftStart + k
        if (pos >= 0 && pos < segLen) buf[pos] = leftStr[k]
    }
    for (let k = 0; k < width; k++) {
        const pos = rightStart + k
        if (pos >= 0 && pos < segLen) buf[pos] = rightStr[k]
    }
    return buf.join('')
}

/**
 * Truncates a string to lengthLimit by splitting into `segments` chunks joined by "...".
 *
 * @param {string} source - string to truncate
 * @param {number} segments - number of chunks when source exceeds lengthLimit
 * @param {number} lengthLimit - max length of the returned result
 * @returns {string} the truncated string
 */
export const truncate = (source, segments, lengthLimit) => {
    if (source.length <= lengthLimit) return source

    const { segStarts, segLens } = computeSegments(source.length, segments, lengthLimit)

    const resultParts = []
    for (let s = 0; s < segments; s++) {
        const st = segStarts[s]
        const len = segLens[s]
        resultParts.push(source.slice(st, st + len))
    }
    return resultParts.join('...')
}

/**
 * @typedef {Object} RulerResult
 * @property {string} source - the original input string
 * @property {string} chars_set - the set of characters counted toward the rank
 * @property {number} segments - number of chunks used
 * @property {number} lengthLimit - the max length constraint applied
 * @property {string} result - the truncated string
 * @property {string} map - the ruler map string
 */

/**
 * Truncates a string to lengthLimit by splitting into `segments` chunks
 * joined by "...", plus a same-length ruler map marking set-char ranks
 * at each chunk's edges.
 *
 * @param {string} source - string to truncate
 * @param {string} charsSet - characters that count toward the rank
 * @param {number} segments - number of chunks when source exceeds lengthLimit
 * @param {number} lengthLimit - max length of the returned result
 * @returns {RulerResult}
 */
export const truncateWithRuler = (source, charsSet, segments, lengthLimit) => {
    const isSetChar = ch => charsSet.includes(ch)

    // rank[i] = count of set-chars from i to end of source (rtl running count), null if not a set char
    const rank = new Array(source.length).fill(null)
    let running = 0
    for (let i = source.length - 1; i >= 0; i--) {
        if (isSetChar(source[i])) {
            running++
            rank[i] = running
        }
    }
    const totalSetChars = running
    const width = String(totalSetChars).length

    let result, ruler

    if (source.length <= lengthLimit) {
        result = source
        ruler = buildSegmentMap(rank, width, 0, source.length)
    } else {
        const { segStarts, segLens } = computeSegments(source.length, segments, lengthLimit)

        const resultParts = []
        const mapParts = []
        for (let s = 0; s < segments; s++) {
            const st = segStarts[s]
            const len = segLens[s]
            resultParts.push(source.slice(st, st + len))
            mapParts.push(buildSegmentMap(rank, width, st, len))
        }
        result = resultParts.join('...')
        ruler = mapParts.join('...')
    }

    return {
        source,
        chars_set: charsSet,
        segments,
        lengthLimit,
        result,
        ruler
    }
}