import HugeInt from '../HugeInt/index.js'
import multiPer from '../MultiplicativePersistence/multiplicativePersistence.js'
import needToCheck from '../MultiplicativePersistence/needToCheck.js'
import onNotModulo10 from '../MultiplicativePersistence/onNotModulo10.js'
import postMessage from '../utils/postMessage.js'
import sleep from '../utils/sleep.js'

/**
 * This is the main function that run the search
 * @param BASE
 * @param COUNT_ITERATIONS
 * @param CALC_ITERATIONS
 * @param ITERATIONS_NOT_FOUND
 * @param ITERATIONS_NOT_FOUND_LIMIT
 * @param LAST_FOUND
 * @param MAX_STEPS
 * @param NUMBER {bigint}
 * @param UP_TIME_MILLISECONDS
 * @param worker { Worker }
 * @returns {Promise<void>}
 */
const multiplicativePersistenceSearch = async ({
       BASE,
       COUNT_ITERATIONS,
       CALC_ITERATIONS,
       ITERATIONS_NOT_FOUND,
       ITERATIONS_NOT_FOUND_LIMIT,
       LAST_FOUND,
       MAX_STEPS,
       NUMBER,
       UP_TIME_MILLISECONDS,
       worker,
    }) => {
    /**
     * @type {SelfEnv}
     */
    const selfEnv = process.selfEnv

    let base = BASE || selfEnv.INIT_BASE
    let countIterations = COUNT_ITERATIONS || 0
    let currentNo = NUMBER.toString(base) === selfEnv.INIT_NUMBER.toString(base) ? new HugeInt(NUMBER, base) : (() =>
            // + 1n because this number already has been checked
            new HugeInt(NUMBER + 1n, base)
    )()
    let lastNumberFound = new HugeInt(LAST_FOUND || 0n, base)
    let logAfterCountIterations = countIterations + 1000
    let maxSteps = MAX_STEPS || selfEnv.INIT_MAX_STEPS
    let calcIterations = CALC_ITERATIONS || selfEnv.INIT_CALC_ITERATIONS
    let upTime = UP_TIME_MILLISECONDS || selfEnv.INIT_UP_TIME_MILLISECONDS
    let iterationsNotFoundLimit = ITERATIONS_NOT_FOUND_LIMIT || 10_000_000
    let notFoundIterations = ITERATIONS_NOT_FOUND || 0

    const startSessionTime = Date.now()
    let notToBreakCondition = true
    let endTime
    let iterationsPerLog = countIterations
    let messages = []
    let startTime = Date.now() - upTime
    let startTimeLog = Date.now()
    let steps = 0

    /**
     * Start (or continue) the Multiplicative Persistence search
     */
    while (notToBreakCondition) {

        onNotModulo10(currentNo)
        const permutationsSaved = needToCheck(currentNo)

        //steps = 2
        //if (!skip) steps = multiPer(currentNo, base)
        steps = multiPer(currentNo, base)
        //steps = 2
        calcIterations += permutationsSaved + 1n
        countIterations++

        if (steps !== 2) {
            iterationsNotFoundLimit = Math.max(countIterations, iterationsNotFoundLimit)
            notFoundIterations = 0

            messages.push({
                atRunTime: Date.now() - startTime,
                calcIterations,
                currentNo: {
                    value: currentNo.value
                },
                steps,
            })
        }
        else {
            notFoundIterations++
            notToBreakCondition = iterationsNotFoundLimit > notFoundIterations
        }

        if ((countIterations > logAfterCountIterations) || (steps > maxSteps)) {
            endTime = Date.now()

            if (steps > maxSteps) {
                maxSteps = steps
                lastNumberFound = currentNo.clone()
            }
            iterationsPerLog = countIterations - iterationsPerLog

            const timeForIterations = endTime - startTimeLog
            const timeForSingleIteration = timeForIterations / iterationsPerLog
            logAfterCountIterations = Math.floor(2000 / timeForSingleIteration) + countIterations
            if (logAfterCountIterations === Infinity) logAfterCountIterations = countIterations + 10_000

            if (postMessage(worker, 'found', {
                calcIterations,
                countIterations,
                currentNo: currentNo.value,
                endTime,
                iterationsNotFoundLimit,
                iterationsPerLog,
                lastNumberFound: lastNumberFound.value,
                length: currentNo.length,
                maxSteps,
                messages,
                notFoundIterations,
                startSessionTime,
                startTime,
                startTimeLog,
            }))
                messages = []

            startTimeLog = Date.now()
            iterationsPerLog = countIterations

            console.log(process.env.log)
        }
        if (notToBreakCondition) currentNo.addOne()
    }
    endTime = Date.now()

    while (process.env.isWorkerReady !== 'true') {
        await sleep(10)
    }

    postMessage(worker, 'found', {
        calcIterations,
        countIterations,
        currentNo: currentNo.value,
        endTime,
        iterationsNotFoundLimit,
        iterationsPerLog,
        lastNumberFound: lastNumberFound.value,
        length: currentNo.length,
        maxSteps,
        messages,
        notFoundIterations,
        startSessionTime,
        startTime,
        startTimeLog,
    })
    while (process.env.isWorkerReady !== 'true') {
        await sleep(10)
    }
    console.log(process.env.log)
    console.log('---------- FINISH ----------')
}

export default multiplicativePersistenceSearch