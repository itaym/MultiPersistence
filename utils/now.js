import ToPrimitive from '../ToPrimitive/index.js'

const hrMilliseconds = process.hrtime.bigint()
const dateNow = Date.now()

/**
 * Creates a high‑resolution timestamp function.
 *
 * Combines an initial wall‑clock time with monotonic hrtime deltas.
 *
 * @param {bigint} hrMilliseconds
 *     Initial high‑resolution timestamp.
 *
 * @param {number} dateNow
 *     Initial wall‑clock timestamp.
 *
 * @returns {() => number}
 *     Function returning the current timestamp in milliseconds.
 */
const now = (hrMilliseconds, dateNow) => () => {
    const hrNowMilliseconds = process.hrtime.bigint()
    return dateNow + Math.floor(Number(hrNowMilliseconds - hrMilliseconds) / 1_000_000)
}

/**
 * High‑resolution timestamp exposed as a ToPrimitive instance.
 *
 * @type {ToPrimitive}
 */
export default new ToPrimitive(null, now(hrMilliseconds, dateNow))
