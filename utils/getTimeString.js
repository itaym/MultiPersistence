const ONE_DAY = 60 * 60 * 24
const TIME_UNITS = [
    BigInt(ONE_DAY * 365),
    BigInt(ONE_DAY * 365 / 12),
    BigInt(ONE_DAY),
    BigInt(ONE_DAY / 24),
    BigInt(ONE_DAY / (24 * 60)),
    BigInt(ONE_DAY / (24 * 60 * 60)),
]

const TIME_UNITS_NAMES = [
    'Year',
    'Month',
    'Day',
    'Hour',
    'Minute',
    'Second',
    'Milli'
]

/**
 * Format a single time‑unit count into a readable string.
 *
 * Converts a BigInt unit count into either:
 *   - a locale string (if ≤ 15 digits), or
 *   - scientific notation (if > 15 digits)
 *
 * Example:
 *   getUnitString(3n, 2) → "3 Days"
 *
 * @param {bigint} unitCount
 *     Number of units (e.g., years, days, hours).
 *
 * @param {number} i
 *     Index into `TIME_UNITS_NAMES` determining the unit label.
 *
 * @returns {string}
 *     Human‑readable representation of the unit count.
 */
const getUnitString = function(unitCount, i) {
    let unitString = unitCount.toString()
    if (unitString.length > 15) {
        unitString = `${unitString.charAt(0)}.${unitString.substring(1, 14)}E${unitString.length - 1}`
    }
    else {
        unitString = unitCount.toLocaleString()
    }
    return `${unitString} ${TIME_UNITS_NAMES[i]}${unitCount > 1 ? 's' : ''}`
}

/**
 * Convert a duration in milliseconds into a human‑readable time string.
 *
 * The function supports both `number` and `bigint` inputs. Internally, the
 * value is converted to BigInt for consistent high‑precision arithmetic.
 *
 * Units included:
 *   - Year
 *   - Month
 *   - Day
 *   - Hour
 *   - Minute
 *   - Second
 *   - Millisecond (optional)
 *
 * If `excludeMilliseconds` is true (default), the value is rounded down to the
 * nearest full second before formatting.
 *
 * Example:
 *   getTimeString(123456789n)
 *   → "1 Day ,10 Hours ,17 Minutes ,36 Seconds"
 *
 * @param {bigint|number} numOfMilliseconds
 *     Duration in milliseconds.
 *
 * @param {boolean} [excludeMilliseconds=true]
 *     Whether to omit the final millisecond component.
 *
 * @returns {string}
 *     A comma‑separated human‑readable time string.
 */
export function getTimeString(numOfMilliseconds, excludeMilliseconds = true) {
    if (numOfMilliseconds?.constructor?.name !== 'BigInt') numOfMilliseconds = Math.floor(numOfMilliseconds)
    let numOfMillis = BigInt(numOfMilliseconds)

    if (excludeMilliseconds) {
        numOfMillis = numOfMillis / 1000n * 1000n
    }

    let timeStrings = []

    for (let i = 0; i < TIME_UNITS.length; i++) {
        const unit = TIME_UNITS[i] * 1000n
        const unitCount = numOfMillis / unit

        if (unitCount >= 1) {
            numOfMillis -= unitCount * unit
            timeStrings.push(getUnitString(unitCount, i))
        }
        else if (i > 4) {
            numOfMillis -= unitCount * unit
            timeStrings.push(getUnitString(unitCount, i))
        }
    }
   if (numOfMillis > 0n && !excludeMilliseconds)
       timeStrings.push(getUnitString(numOfMillis, 6))

    return timeStrings.join(' ,')
}
