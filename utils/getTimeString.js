/** @type {number} seconds per day */
const ONE_DAY = 60 * 60 * 24

/** @type {bigint[]} seconds per unit, year down to second */
const TIME_UNITS = [
    BigInt(ONE_DAY * 365),
    BigInt(ONE_DAY * 365 / 12),
    BigInt(ONE_DAY),
    BigInt(ONE_DAY / 24),
    BigInt(ONE_DAY / (24 * 60)),
    BigInt(ONE_DAY / (24 * 60 * 60)),
]

/** @type {string[]} unit names matching {@link TIME_UNITS}, plus milliseconds */
const TIME_UNITS_NAMES = [
    'Year',
    'Month',
    'Day',
    'Hour',
    'Minute',
    'Second',
    'Milli',
]

/**
 * `"<count> <unit>[s]"`, in scientific notation past 15 digits.
 *
 * @param {number} i index into {@link TIME_UNITS_NAMES}
 * @param {bigint} unitCount
 * @returns {string}
 */
const getUnitString = (i, unitCount) => {
    let unitString = unitCount.toString()
    if (unitString.length > 15) {
        unitString = `${unitString.charAt(0)}.${unitString.substring(1, 14)}E${unitString.length - 1}`
    } else {
        unitString = unitCount.toLocaleString()
    }
    return `${unitString} ${TIME_UNITS_NAMES[i]}${unitCount > 1 ? 's' : ''}`
}

/**
 * Human-readable duration, e.g. `"1 Hour ,5 Minutes ,3 Seconds"`.
 *
 * @param {bigint|number} numOfMilliseconds
 * @param {boolean} [excludeMilliseconds=true] rounds down to whole seconds
 * @returns {string}
 */
const getTimeString = (numOfMilliseconds, excludeMilliseconds = true) => {
    if (numOfMilliseconds?.constructor?.name !== 'BigInt') {
        numOfMilliseconds = Math.floor(numOfMilliseconds)
    }

    let numOfMillis = BigInt(numOfMilliseconds)

    if (excludeMilliseconds) {
        numOfMillis = numOfMillis / 1000n * 1000n
    }

    const timeStrings = []

    for (let i = 0; i < TIME_UNITS.length; i++) {
        const unit = TIME_UNITS[i] * 1000n
        const unitCount = numOfMillis / unit

        if (unitCount >= 1) {
            numOfMillis -= unitCount * unit
            timeStrings.push(getUnitString(i, unitCount))
        } else if (i > 4) {
            numOfMillis -= unitCount * unit
            timeStrings.push(getUnitString(i, unitCount))
        }
    }
    if (numOfMillis > 0n && !excludeMilliseconds) {
        timeStrings.push(getUnitString(6, numOfMillis))
    }

    return timeStrings.join(' ,')
}

export default getTimeString
