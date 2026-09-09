import ToPrimitive from '../ToPrimitive/index.js'

const hrMilliseconds = process.hrtime.bigint()
const dateNow = Date.now()

/**
 * Builds a timestamp function: an initial wall-clock time advanced by monotonic hrtime deltas.
 *
 * @param {bigint} hrMilliseconds initial high-resolution timestamp
 * @param {number} dateNow initial wall-clock timestamp
 * @returns {() => number} current timestamp in milliseconds
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
