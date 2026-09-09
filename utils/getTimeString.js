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
 * Formats a unit count and its name, e.g. `"3 Hours"`. Long values use scientific notation.
 *
 * @param {BigInt} unitCount
 * @param {number} i index into `TIME_UNITS_NAMES`
 * @returns {string}
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
 * Converts a millisecond duration into a human-readable time string.
 *
 * @param {BigInt|number} numOfMilliseconds
 * @param {boolean} [excludeMilliseconds=true] omit the milliseconds unit
 * @returns {string}
 */
export function getTimeString(numOfMilliseconds, excludeMilliseconds = true) {
    if (numOfMilliseconds?.constructor?.name !== 'BigInt')
        numOfMilliseconds = Math.floor(numOfMilliseconds)

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
