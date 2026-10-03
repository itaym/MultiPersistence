import ToPrimitive from '#ToPrimitive/index.js'

/** @type {bigint} high-resolution time at module load, in nanoseconds */
const hrMilliseconds = process.hrtime.bigint()

/** @type {number} wall-clock time at module load, in milliseconds */
const dateNow = Date.now()

/**
 * Builds a clock: wall-clock milliseconds advanced by high-resolution elapsed time.
 *
 * @param {number} dateNow wall-clock start, in milliseconds
 * @param {bigint} hrMilliseconds high-resolution start, in nanoseconds
 * @returns {() => number}
 */
// eslint-disable-next-line no-shadow
const now = (dateNow, hrMilliseconds) => () => {
    const hrNowMilliseconds = process.hrtime.bigint()
    return dateNow + Math.floor(Number(hrNowMilliseconds - hrMilliseconds) / 1_000_000)
}

/** Monotonic wall clock; coerces to `1n +` current milliseconds. */
const clock = new ToPrimitive(now(dateNow, hrMilliseconds), null)

export default clock
