const TIME_UNITS = [
    BigInt(60 * 60 * 24 * 365),
    BigInt(60 * 60 * 24 * 365 / 12),
    BigInt(60 * 60 * 24),
    BigInt(60 * 60 * 24 / 24),
    BigInt(60 * 60 * 24 / (24 * 60)),
]

const TIME_UNITS_NAMES = [
    'Year',
    'Month',
    'Day',
    'Hour',
    'Minute',
    'Second',
]

export default function getTimeString(numOfMilliseconds) {
    if (numOfMilliseconds?.constructor?.name !== 'BigInt') numOfMilliseconds = Math.floor(numOfMilliseconds)
    let numOfSeconds = BigInt(numOfMilliseconds) / 1000n

    let timeStrings = []

    for (let i = 0; i < TIME_UNITS.length; i++) {
        const unit = TIME_UNITS[i]
        const unitCount = numOfSeconds / unit

        if (unitCount >= 1) {
            numOfSeconds -= unitCount * unit
            let unitString = unitCount.toString()
            if (unitString.length > 15) {
                unitString = `${unitString.charAt(0)}.${unitString.substring(1, 14)}E${unitString.length - 1}`
            }
            else {
                unitString = unitCount.toLocaleString()
            }

            timeStrings.push(`${unitString} ${TIME_UNITS_NAMES[i]}${unitCount > 1 ? 's' : ''}`)
        }
    }

    timeStrings.push(`${numOfSeconds} ${TIME_UNITS_NAMES[TIME_UNITS_NAMES.length - 1]}${numOfSeconds > 1 ? 's' : ''}`)

    return timeStrings.join(' and ')
}