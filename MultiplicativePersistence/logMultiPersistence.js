import { baseDigits } from '../Digits/index.js'
import {
    sanitize,
    truncate,
    truncateWithRuler,
} from '../utils/stringsUtils.js'
import { getTimeString } from '../utils/getTimeString.js'
import countPermutations from '../permutations/countPermutations.js'
import HugeInt from '../HugeInt/index.js'
import chalk from 'chalk'

const RULER_WIDTH = 140
const MAX_MILLISECONDS = BigInt('9'.repeat(500))

/**
 * Creates a color-toggling function for alternating log colors.
 *
 * @returns {function(): String} function returning the next color name
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
 * Truncates text and pads it to a fixed column width with dashes.
 *
 * @param {String} text - text to fit into the column
 * @param {Number} [width=70] - column width
 * @returns {String} truncated, dash-padded column
 */
const formatColumn = (text, width = 70) => truncate(text, 2, width).padEnd(width, '-')

/**
 * Formats two texts as side-by-side dash-padded columns on one log line.
 *
 * @param {String} left - left column text
 * @param {String} right - right column text
 * @param {Number} [leftWidth=70] - left column width
 * @param {Number} [rightWidth=70] - right column width
 * @returns {String} the combined row, newline-terminated
 */
const formatRow = (left, right, leftWidth = 70, rightWidth = 70) =>
    formatColumn(left, leftWidth) + formatColumn(right, rightWidth) + '\n'

/**
 * Computes the iteration-rate, ETA and progress stats shown in the log header.
 *
 * @param {Object} params
 * @param {BigInt} params.calcIterations - calculated iterations so far
 * @param {Number} params.countIterations - actual iterations counted
 * @param {Number} params.iterationsPerLog - iterations since last log
 * @param {Number} params.notFound - current not-found count
 * @param {Number} params.notFoundLimit - max allowed not-found count
 * @param {Number} params.endTime - current timestamp
 * @param {Number} params.startTime - current run start timestamp
 * @param {Number} params.startTimeLog - last log timestamp
 * @param {BigInt} params.exIterations - expected total iterations
 * @returns {Object} derived rate/time stats
 */
const computeRateStats = ({
    calcIterations,
    countIterations,
    iterationsPerLog,
    notFound,
    notFoundLimit,
    endTime,
    startTime,
    startTimeLog,
    exIterations,
}) => {
    const numOfMilliseconds = endTime - startTime
    const numOfMillisecondsLog = endTime - startTimeLog

    const iterationsPerSecond = Math.floor(Number(calcIterations / BigInt(Math.ceil(numOfMilliseconds / 1000))))
    const countIterationsPerSecond = Math.floor(countIterations / (numOfMilliseconds / 1000))
    const iterationsPerSecondLog = Math.floor(iterationsPerLog / (numOfMillisecondsLog / 1000))
    const notFoundTimeLeft = Math.max((notFoundLimit - notFound) / countIterationsPerSecond * 1000, 0)
    const percentDone = (Number(calcIterations * 1_000_000_000_000n / exIterations * 100n) / 1_000_000_000_000).toFixed(10)

    let timeLeft = Math.max(Number((exIterations - calcIterations) / BigInt(iterationsPerSecond + 1)) * 1000, 0)
    if (timeLeft === Infinity || timeLeft > MAX_MILLISECONDS) timeLeft = MAX_MILLISECONDS
    timeLeft = BigInt(timeLeft)

    return {
        numOfMilliseconds,
        iterationsPerSecond,
        countIterationsPerSecond,
        iterationsPerSecondLog,
        notFoundTimeLeft,
        percentDone,
        timeLeft,
    }
}

/**
 * Builds the per-step "found" log lines and the running total across all steps.
 *
 * @param {CountStep[]} countSteps - per-step stats
 * @param {Number} endTime - current timestamp
 * @param {Number} startTime - current run start timestamp
 * @returns {{countLog: String[], totalFound: Number}}
 */
const buildCountStepsLog = (countSteps, endTime, startTime) => {
    const countLog = []
    let totalFound = 0

    for (let index in countSteps) {
        const cs = countSteps[index]
        if (!cs?.count) continue

        totalFound += cs.count
        const stepLabel = (index + '').padStart(2, '0').padEnd(5, ' =>')
        const countCol = (cs.count.toLocaleString() + '').padStart(18, ' ')
        const combinationsCol = truncate(cs.combinations.toLocaleString(), 2, 44).padStart(45, ' ')
        const iterationCol = truncate(cs.iteration.toLocaleString(), 2, 18).padStart(18, ' ')
        const elapsedCol = truncate(getTimeString(endTime - cs.atRunTime - startTime), 2, 48)
        countLog.push(`${stepLabel}${countCol}, ${combinationsCol}, ${iterationCol}. ${elapsedCol}`)
    }

    return { countLog, totalFound }
}

/**
 * @typedef {Object} CountStep
 * @property {HugeInt} first - first number found at this step
 * @property {Number} step - step index
 * @property {Number} count - numbers found at this step
 * @property {BigInt} combinations - combinations count
 * @property {BigInt} iteration - iteration count
 * @property {Number} atRunTime - timestamp when this step was reached
 */

/**
 * @typedef {Object} LogSessionStats
 * @property {BigInt} calcIterations - calculated iterations so far
 * @property {Number} countIterations - actual iterations counted
 * @property {CountStep[]} countSteps - per-step stats
 * @property {BigInt} currentNo - current number being checked
 * @property {Number} endTime - current timestamp
 * @property {Number} notFoundLimit - max allowed not-found count
 * @property {Number} iterationsPerLog - iterations since last log
 * @property {Object<String, {found: Number}>} lengths - stats keyed by number length
 * @property {Number} messagesCount - total messages sent
 * @property {Number} notFound - current not-found count
 * @property {Number} startSessionTime - session start timestamp
 * @property {Number} startTime - current run start timestamp
 * @property {Number} startTimeLog - last log timestamp
 */

/**
 * Creates a logging function for multiplicative-persistence sessions.
 *
 * @param {HugeInt} goalNumber - the target number
 * @param {BigInt} base - numeric base used for HugeInt operations
 * @returns {function(LogSessionStats): String} function that formats and returns a log string
 */
export default function logMultiPersistence({ goalNumber, base }) {
    const exIterations = countPermutations(BigInt(goalNumber.length), base - 2n)

    return function ({
        calcIterations,
        countIterations,
        countSteps,
        currentNo,
        endTime,
        notFoundLimit,
        iterationsPerLog,
        lengths,
        messagesCount,
        notFound,
        startSessionTime,
        startTime,
        startTimeLog,
    }) {
        const lastStep = countSteps[countSteps.length - 1]
        const maxSteps = lastStep?.step
        const lastNumberFound = new HugeInt((lastStep?.first || 0n).currentNoValue, base)
        const currentNoHI = new HugeInt(currentNo, base)

        const sessionMilliseconds = endTime - startSessionTime
        const cellNo = currentNoHI.cellsLength
        const currentNumberStr = sanitize(currentNoHI.toLocaleString())
        const truncatedWithRuler = truncateWithRuler(currentNumberStr, baseDigits(base), 3, RULER_WIDTH)
        const lastNumberFoundStr = truncate(sanitize(lastNumberFound.toLocaleString()), 2, 52)
        const currentNoLength = currentNoHI.length
        const foundInLength = lengths[currentNoLength + '']?.found || 0

        const rates = computeRateStats({
            calcIterations, countIterations, iterationsPerLog, notFound,
            notFoundLimit, endTime, startTime, startTimeLog, exIterations,
        })
        const { countLog, totalFound } = buildCountStepsLog(countSteps, endTime, startTime)

        let logStr = '-'.repeat(RULER_WIDTH) + '\n'
        logStr += truncatedWithRuler.result + '\n'
        logStr += truncatedWithRuler.ruler + '\n'

        logStr += 'Number found in ' + truncate(`${maxSteps} -> ${lastNumberFoundStr}`, 3, RULER_WIDTH).padEnd(54, '-') +
            `Current number length: ${currentNoLength.toLocaleString()} (${cellNo})`.padEnd(70, '-') + '\n'

        logStr += formatRow(
            `Calc Iter.: ${calcIterations.toLocaleString()} (${rates.percentDone}%)`,
            `Real Iter.: ${countIterations.toLocaleString()} saved: ${(calcIterations - BigInt(countIterations)).toLocaleString()}`
        )

        logStr += formatRow(
            `Avg Calc Iter./sec: ${rates.iterationsPerSecond.toLocaleString()} (x ${(Number(calcIterations) / countIterations).toFixed(8)})`,
            `Avg Real Iter./sec: ${rates.countIterationsPerSecond.toLocaleString()}`
        )

        logStr += formatRow(
            `Log Iterations/sec: ${rates.iterationsPerSecondLog.toLocaleString()}`,
            `Not Found: ${getTimeString(rates.notFoundTimeLeft)} ${notFound.toLocaleString()}/${notFoundLimit.toLocaleString()}`
        )

        logStr += formatRow(
            `Up Time: ${getTimeString(rates.numOfMilliseconds)}`,
            `Time left: ${getTimeString(rates.timeLeft)}`
        )

        logStr += formatRow(
            `Session: ${getTimeString(sessionMilliseconds)}`,
            `Base: ${base} found: ${messagesCount.toLocaleString()} / ${foundInLength.toLocaleString()} / ${totalFound.toLocaleString()}`
        )

        const getAColor = getColor()
        countLog.forEach(logString => logStr += chalk[getAColor()](logString) + '\n')
        return logStr.slice(0, -1)
    }
}