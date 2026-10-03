import memorize from './memorize.js'

/**
 * Replaces control, zero-width and bidi characters with `X`.
 *
 * @param {string} str
 * @returns {string}
 */
export const sanitize = str => str
    // ASCII control chars + DEL + C1 control chars
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F-\x9F]/g, 'X')
    // Zero‑width characters
    .replace(/[\u200B-\u200D]/g, 'X')
    // Bidirectional control characters
    .replace(/[\u202A-\u202E]/g, 'X')

/**
 * Lengths and starts of the kept segments of a truncated string; disk-memorized.
 *
 * @type {(sourceLength: number, segments: number, lengthLimit: number) => SegmentBounds}
 */
const computeSegments = memorize((sourceLength, segments, lengthLimit) => {
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

    return { segLens, segStarts }
}, 'computeSegments')

/**
 * Ruler segment: the set-char ranks at the segment's two ends, dashes elsewhere.
 *
 * @param {(number|null)[]} rank set-char rank per index, `null` for other chars
 * @param {number} segLen
 * @param {number} segStart
 * @param {number} width digits of the highest rank
 * @returns {string}
 */
const buildSegmentMap = (rank, segLen, segStart, width) => {
    const buf = new Array(segLen).fill('-')

    let leftIdx = -1
    let rightIdx = -1
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
 * `source` cut to `lengthLimit` as `segments` pieces joined by `...`.
 *
 * @param {number} lengthLimit
 * @param {number} segments
 * @param {string} source
 * @returns {string}
 */
export const truncate = (lengthLimit, segments, source) => {
    if (source.length <= lengthLimit) return source

    const { segLens, segStarts } = computeSegments(source.length, segments, lengthLimit)

    const resultParts = []
    for (let s = 0; s < segments; s++) {
        const st = segStarts[s]
        const len = segLens[s]
        resultParts.push(source.slice(st, st + len))
    }
    return resultParts.join('...')
}

/**
 * {@link truncate} plus a ruler that numbers the `charsSet` characters from the right.
 *
 * @param {string} charsSet characters to count
 * @param {number} lengthLimit
 * @param {number} segments
 * @param {string} source
 * @returns {RulerResult}
 */
export const truncateWithRuler = (charsSet, lengthLimit, segments, source) => {
    /**
     * @param {string} ch
     * @returns {boolean}
     */
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

    let result
    let ruler

    if (source.length <= lengthLimit) {
        result = source
        ruler = buildSegmentMap(rank, source.length, 0, width)
    } else {
        const { segLens, segStarts } = computeSegments(source.length, segments, lengthLimit)

        const resultParts = []
        const mapParts = []
        for (let s = 0; s < segments; s++) {
            const st = segStarts[s]
            const len = segLens[s]
            resultParts.push(source.slice(st, st + len))
            mapParts.push(buildSegmentMap(rank, len, st, width))
        }
        result = resultParts.join('...')
        ruler = mapParts.join('...')
    }

    return {
        chars_set: charsSet,
        lengthLimit,
        result,
        ruler,
        segments,
        source,
    }
}
