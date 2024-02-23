/**
 *
 * @type {bigint}
 */
const hrMilliseconds = process.hrtime.bigint()
const dateNow = Date.now()

/**
 *
 * @param hrMilliseconds {bigint}
 * @param dateNow {number}
 * @return {function()}
 */
const now = (hrMilliseconds, dateNow) => () => {
    const hrNowMilliseconds = process.hrtime.bigint()
    return dateNow + Math.floor(Number(hrNowMilliseconds - hrMilliseconds) / 1_000_000)
}

export default now(hrMilliseconds, dateNow)
