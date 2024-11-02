import HugeInt from '../HugeInt/index.js'
import ToPrimitive from '../ToPrimitive/index.js'
import baseAccommodate from './baseAccommodate.js'
import onModuloBase from './onNotModuloBase.js'
import postMessages from '../utils/postMessage.js'
import prepareMessage from '../utils/prepareMessage.js'
import waitShowLog from '../utils/waitShowLog.js'
import { multiPer, multiPerNBC } from './index.js'

/**
 *
 * @param base
 * @param iterations
 * @param last_number
 * @param stepsObj
 * @param up_time
 * @param log_interval
 * @param startSessionTime
 * @param startTime
 * @param worker { Worker }
 * @return {Promise<void>}
 */
export const multiPerSearch = async (
    {
        base,
        iterations,
        last_number,
        steps:stepsObj,
        up_time,
    },
    log_interval,
    startSessionTime,
    startTime,
    worker,
    ) => {

    let calcIterations = iterations.calculated
    let countIterations = iterations.count
    let currentNo = new HugeInt(last_number, base)
    let endTime
    let iterationsPerLog = countIterations
    let logAfter = (countIterations + countIterations / up_time * log_interval) || 250_000
    let messages = []
    let notFound = iterations.found_nothing
    let notFoundLimit = iterations.found_nothing_break_at
    let notToBreak = notFoundLimit > notFound
    let startTimeLog = startSessionTime
    let steps = 2
    let multiPerNBB = multiPerNBC.bind(null, currentNo, Number(base))
    let multiPerFn = multiPer.bind(null, currentNo, Number(base))
    let prepareBindMessage = prepareMessage.bind(currentNo)
    let on_ModuloBase = onModuloBase.bind(currentNo)

    const createPermutations = baseAccommodate
        .supported.includes(process.normalizedEnv.base)
        ? new ToPrimitive(currentNo, baseAccommodate)
        : 1n

    const createMessage = () => prepareBindMessage(startTime, calcIterations, steps)

    currentNo.addOne()

    while (notToBreak) {

        on_ModuloBase()

        calcIterations += createPermutations
        countIterations++

        steps = multiPerFn()

        if (steps !== 2) {
            notFoundLimit = Math.max(countIterations, notFoundLimit)
            notFound = 0

            messages.push(createMessage())

            if (messages.length >= 100) {
                if (postMessages(worker, 'stack', {
                    messages,
                })) messages = []
            }
        }
        else {
            notFound++
            notToBreak = notFoundLimit > notFound
        }

        if (countIterations > logAfter) {
            endTime = Date.now()
            const currentNoValue = currentNo.value
            if (multiPerFn !== multiPerNBB) {
                multiPerFn = multiPerNBB
            }
            iterationsPerLog = countIterations - iterationsPerLog
            const timeIteration = (endTime - startTimeLog) / iterationsPerLog
            logAfter = Math.floor(log_interval / timeIteration) + countIterations
            if (logAfter === Infinity) logAfter = countIterations + 100_000

            await waitShowLog()

            if (postMessages(worker, 'found', {
                calcIterations,
                countIterations,
                currentNo: currentNoValue,
                endTime,
                notFoundLimit,
                iterationsPerLog,
                messages,
                notFound,
                startTimeLog,
            })) messages = []

            iterationsPerLog = countIterations
            startTimeLog = Date.now()
        }
        currentNo.addOne()
    }

    endTime = Date.now()
    await waitShowLog()

    currentNo.subtractOne()

    postMessages(worker, 'found', {
        calcIterations,
        countIterations,
        currentNo: currentNo.value,
        endTime,
        notFoundLimit,
        iterationsPerLog,
        length: currentNo.length,
        messages,
        notFound,
        startTimeLog,
    })
    await waitShowLog()
}
