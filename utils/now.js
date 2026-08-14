import ToPrimitive from '../ToPrimitive/index.js'

const hrMilliseconds = process.hrtime.bigint()
const dateNow = Date.now()

/**
 * Creates a high‑resolution timestamp function.
 *
 * The returned function produces a monotonic, millisecond‑accurate timestamp
 * based on:
 * - `Date.now()` at initialization time
 * - `process.hrtime.bigint()` deltas for high‑precision elapsed time
 *
 * This avoids clock drift and provides stable timing even if the system clock
 * changes.
 *
 * @param {bigint} hrMilliseconds
 *   The high‑resolution timestamp captured at initialization.
 *
 * @param {number} dateNow
 *   The wall‑clock timestamp captured at initialization.
 *
 * @returns {() => number}
 *   A function that returns the current time in milliseconds, combining
 *   high‑resolution monotonic timing with the initial wall‑clock base.
 */
const now = (hrMilliseconds, dateNow) => () => {
    const hrNowMilliseconds = process.hrtime.bigint()
    return dateNow + Math.floor(Number(hrNowMilliseconds - hrMilliseconds) / 1_000_000)
}

/**
 * Exports a `ToPrimitive` wrapper around the high‑resolution `now()` function.
 *
 * When coerced to a primitive (e.g., via `Number(now)` or unary `+now`),
 * this instance will evaluate to the current high‑resolution timestamp.
 *
 * @type {ToPrimitive}
 */
export default new ToPrimitive(null, now(hrMilliseconds, dateNow))

