/**
 * High‑resolution timestamp generator aligned to `Date.now()`.
 *
 * This module captures:
 *   - `hrMilliseconds`: a monotonic high‑resolution timestamp from
 *       `process.hrtime.bigint()`
 *   - `dateNow`: the wall‑clock time from `Date.now()`
 *
 * It then exports a function that returns the current wall‑clock time
 * adjusted using high‑resolution monotonic timing:
 *
 *     dateNow + (hrNow - hrMilliseconds) / 1_000_000
 *
 * This avoids drift and provides stable millisecond timing even when
 * `Date.now()` is coarse or affected by system clock adjustments.
 *
 * @module now
 */
const hrMilliseconds = process.hrtime.bigint()
const dateNow = Date.now()

/**
 * Create a high‑resolution timestamp function.
 *
 * @param {bigint} hrMilliseconds
 *     The initial high‑resolution timestamp from `process.hrtime.bigint()`.
 *
 * @param {number} dateNow
 *     The initial wall‑clock timestamp from `Date.now()`.
 *
 * @returns {function(): number}
 *     A function that returns the current wall‑clock time in milliseconds,
 *     corrected using monotonic high‑resolution timing.
 */

const now = (hrMilliseconds, dateNow) => () => {
    const hrNowMilliseconds = process.hrtime.bigint()
    return dateNow + Math.floor(Number(hrNowMilliseconds - hrMilliseconds) / 1_000_000)
}

export default now(hrMilliseconds, dateNow)
