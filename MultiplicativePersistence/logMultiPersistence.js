import { baseDigits } from '#Digits/index.js'
import HugeInt from '#HugeInt/index.js'
import { positionOf } from '#permutations/positionOf.js'
import getTimeString from '#utils/getTimeString.js'
import {
    sanitize,
    truncate,
    truncateWithRuler,
} from '#utils/stringsUtils.js'
import chalk from 'chalk'

/** @type {number} log line width */
const RULER_WIDTH = 140

/** @type {bigint} cap for the time-left estimate */
const MAX_MILLISECONDS = BigInt('9'.repeat(500))

/**
 * Builds an alternator between the log line colors.
 *
 * @returns {() => string}
 */
const getColor = () => {
    const colors = ['white', 'yellow']
    let currentColor = 1
    return () => {
        currentColor = 1 - currentColor
        return colors[currentColor]
    }
}

/**
 * `text` truncated and dash-padded to `width`.
 *
 * @param {string} text
 * @param {number} [width=70]
 * @returns {string}
 */
const formatColumn = (text, width = 70) => truncate(width, 2, text).padEnd(width, '-')

/**
 * Two formatted columns and a newline.
 *
 * @param {string} left
 * @param {string} right
 * @param {number} [leftWidth=70]
 * @param {number} [rightWidth=70]
 * @returns {string}
 */
const formatRow = (left, right, leftWidth = 70, rightWidth = 70) =>
    formatColumn(left, leftWidth) + formatColumn(right, rightWidth) + '\n'

/**
 * @param {number} bytes
 * @returns {string} gigabytes, two decimals
 */
const toGB = bytes => (bytes / 1024 ** 3).toFixed(2)

/**
 * Rates, progress and time-left estimates for the log.
 *
 * @param {RateStatsParams} params
 * @returns {LogRates}
 */
const computeRateStats = ({
    actualIterations,
    countIterations,
    endTime,
    exIterations,
    iterationsPerLog,
    notFound,
    notFoundLimit,
    startTime,
    startTimeLog,
}) => {
    const numOfMilliseconds = endTime - startTime
    const numOfMillisecondsLog = endTime - startTimeLog

    const iterationsPerSecond = Math.floor(Number(actualIterations / BigInt(Math.ceil(numOfMilliseconds / 1000))))
    const countIterationsPerSecond = Math.floor(countIterations / (numOfMilliseconds / 1000))
    const iterationsPerSecondLog = Math.floor(iterationsPerLog / (numOfMillisecondsLog / 1000))
    const notFoundTimeLeft = Math.max((notFoundLimit - notFound) / countIterationsPerSecond * 1000, 0)
    const percentDone = (Number(actualIterations * 1_000_000_000_000n / exIterations * 100n) / 1_000_000_000_000)
        .toFixed(10)

    let timeLeft = Math.max(Number((exIterations - actualIterations) / BigInt(iterationsPerSecond + 1)) * 1000, 0)
    if (timeLeft === Infinity || timeLeft > MAX_MILLISECONDS) timeLeft = MAX_MILLISECONDS
    timeLeft = BigInt(timeLeft)

    return {
        countIterationsPerSecond,
        iterationsPerSecond,
        iterationsPerSecondLog,
        notFoundTimeLeft,
        numOfMilliseconds,
        percentDone,
        timeLeft,
    }
}

/**
 * Min, max and most common product length of a histogram.
 *
 * @param {Object<string, number>} [hist]
 * @returns {ProductLengthSummary|null}
 */
const productLengthSummary = hist => {
    const lens = hist ? Object.keys(hist).map(Number) : []
    if (lens.length === 0) return null

    let min = lens[0]
    let max = lens[0]
    let peak = lens[0]
    let peakCount = -1
    for (const len of lens) {
        if (len < min) min = len
        if (len > max) max = len
        if (hist[len] > peakCount) {
            peakCount = hist[len]
            peak = len
        }
    }
    return { max, min, peak }
}

/**
 * One log line per persistence step, plus the total found.
 *
 * @param {TypeStep[]} countSteps
 * @param {number} endTime
 * @param {number} startTime
 * @returns {CountStepsLog}
 */
const buildCountStepsLog = (countSteps, endTime, startTime) => {
    const countLog = []
    let totalFound = 0

    for (const index in countSteps) {
        if (Object.hasOwn(countSteps, index)) {
            const cs = countSteps[index]
            if (!cs?.count) continue

            totalFound += cs.count

            const stepCol = `${index}`.padStart(2, '0')
            const countCol = cs.count.toLocaleString().padStart(16, ' ')
            const iterationCol = truncate(18, 2, cs.iteration.toLocaleString()).padStart(18, ' ')
            const elapsedCol = truncate(30, 2, getTimeString(endTime - cs.atRunTime - startTime)).padEnd(31, ' ')

            const pLen = productLengthSummary(cs.productLengths)
            const pLenCol = (pLen
                ? (pLen.min === pLen.max
                    ? `productLength ${pLen.min}`
                    : `productLength ${pLen.min}-${pLen.max} ~${pLen.peak}`)
                : ''
            ).padEnd(26, ' ')

            countLog.push(`${stepCol} => ${countCol}  ${iterationCol}  ${elapsedCol}${pLenCol}`)
        }
    }

    return { countLog, totalFound }
}

/**
 * Builds the progress log formatter.
 *
 * @param {LogParams} params
 * @returns {(stats: LogSessionStats) => string}
 */
const logMultiPersistence = ({ base, pseudoGoalNumber }) => {
    const exIterations = positionOf(pseudoGoalNumber)

    /**
     * Full progress log text.
     *
     * @param {LogSessionStats} stats
     * @returns {string}
     */
    return ({
        actualIterations,
        countIterations,
        countSteps,
        currentNo,
        endTime,
        iterationsPerLog,
        lengths,
        messagesCount,
        notFound,
        notFoundLimit,
        startSessionTime,
        startTime,
        startTimeLog,
    }) => {
        const lastStep = countSteps[countSteps.length - 1]
        const maxSteps = lastStep?.step
        const lastNumberFound = new HugeInt(base, undefined, (lastStep?.first || 0n).numberValue)
        const currentNoHI = new HugeInt(base, undefined, currentNo)

        const sessionMilliseconds = endTime - startSessionTime
        const cellNo = currentNoHI.cellsLength
        const currentNumberStr = sanitize(currentNoHI.toLocaleString())
        const truncatedWithRuler = truncateWithRuler(baseDigits(base), RULER_WIDTH, 3, currentNumberStr)
        const lastNumberFoundStr = truncate(52, 2, sanitize(lastNumberFound.toLocaleString()))
        const currentNoLength = currentNoHI.length
        const foundInLength = lengths[currentNoLength + '']?.found || 0
        const mem = process.memoryUsage()

        const rates = computeRateStats({
            actualIterations,
            countIterations,
            endTime,
            exIterations,
            iterationsPerLog,
            notFound,
            notFoundLimit,
            startTime,
            startTimeLog,
        })
        const { countLog, totalFound } = buildCountStepsLog(countSteps, endTime, startTime)

        let logStr = '-'.repeat(RULER_WIDTH) + '\n'
        logStr += truncatedWithRuler.result + '\n'
        logStr += truncatedWithRuler.ruler + '\n'

        logStr += 'Number found in ' +
            truncate(RULER_WIDTH, 3, `${maxSteps} -> ${lastNumberFoundStr}`).padEnd(54, '-') +
            `Cells: ${cellNo.toLocaleString()}  RSS: ${toGB(mem.rss)} GB  worker heap: ${toGB(mem.heapUsed)} GB`
                .padEnd(70, '-') + '\n'

        logStr += formatRow(
            `Calc Iter.: ${actualIterations.toLocaleString()} (${rates.percentDone}%)`,
            `Real Iter.: ${countIterations.toLocaleString()} ` +
                `saved: ${(actualIterations - BigInt(countIterations)).toLocaleString()}`,
        )

        logStr += formatRow(
            `Avg Calc Iter./sec: ${rates.iterationsPerSecond.toLocaleString()} ` +
                `(x ${(Number(actualIterations) / countIterations).toFixed(8)})`,
            `Avg Real Iter./sec: ${rates.countIterationsPerSecond.toLocaleString()}`,
        )

        logStr += formatRow(
            `Log Iterations/sec: ${rates.iterationsPerSecondLog.toLocaleString()}`,
            `Not Found: ${getTimeString(rates.notFoundTimeLeft)} ` +
                `${notFound.toLocaleString()}/${notFoundLimit.toLocaleString()}`,
        )

        logStr += formatRow(
            `Up Time: ${getTimeString(rates.numOfMilliseconds)}`,
            `Time left: ${getTimeString(rates.timeLeft)}`,
        )

        logStr += formatRow(
            `Session: ${getTimeString(sessionMilliseconds)}`,
            `Base: ${base} found: ${messagesCount.toLocaleString()} / ` +
                `${foundInLength.toLocaleString()} / ${totalFound.toLocaleString()}`,
        )

        const getAColor = getColor()
        countLog.forEach(logString => (logStr += chalk[getAColor()](logString) + '\n'))
        return logStr.slice(0, -1)
    }
}

export default logMultiPersistence
