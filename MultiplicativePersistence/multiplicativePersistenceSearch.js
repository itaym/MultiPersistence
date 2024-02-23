import HugeInt from '../HugeInt/index.js'
import { multiPer, multiPerNoBaseCheck } from '../MultiplicativePersistence/multiplicativePersistence.js'
import needToCheck from '../MultiplicativePersistence/needToCheck.js'
import onNotModuloBase from '../MultiplicativePersistence/onNotModulo10.js'
import postMessage from '../utils/postMessage.js'
import sleep from '../utils/sleep.js'

export const multiplicativePersistenceSearch = async (initVars, worker) => {

    let {
        base,
        iterations,
        last_number,
        steps:stepsObj,
        up_time,
    } = initVars

    let baseNumber = Number(base)
    let calcIterations = iterations.calculated
    let countIterations = iterations.count
    let currentNo = new HugeInt(last_number, base)
    let iterationsNotFoundLimit = iterations.found_nothing_break_at
    let logAfterCountIterations = iterations.count + 1000
    let maxSteps = stepsObj.length
    let notFoundIterations = iterations.found_nothing

    const startSessionTime = Date.now()
    let notToBreakCondition = iterationsNotFoundLimit >= notFoundIterations
    let endTime
    let iterationsPerLog = countIterations
    let messages = []
    let multiPerFn = multiPer
    let permutationsSaved = 0n
    let startTime = Date.now() - up_time
    let startTimeLog = Date.now()
    let steps = 0

    const createMessage = () => {
        const currentNoStr = currentNo.toString()
        return {
            atRunTime: Date.now() - startTime,
            calcIterations,
            currentNoStr: currentNoStr,
            steps,
        }
    }

    currentNo.addOne(0)

    while (notToBreakCondition) {

        onNotModuloBase(currentNo)

        permutationsSaved = needToCheck(currentNo)

        steps = multiPerFn(currentNo, baseNumber)

        calcIterations += permutationsSaved + 1n
        countIterations++

        if (steps !== 2) {
            iterationsNotFoundLimit = Math.max(countIterations, iterationsNotFoundLimit)
            notFoundIterations = 0

            messages.push(createMessage())

            if (steps > maxSteps) {
                maxSteps = steps
                logAfterCountIterations = countIterations - 1
            }
        }
        else {
            notFoundIterations++
            notToBreakCondition = iterationsNotFoundLimit > notFoundIterations
        }

        if (countIterations > logAfterCountIterations) {
            endTime = Date.now()
            multiPerFn = multiPerNoBaseCheck
            iterationsPerLog = countIterations - iterationsPerLog

            const timeForIterations = endTime - startTimeLog
            const timeForSingleIteration = timeForIterations / iterationsPerLog
            logAfterCountIterations = Math.floor(2_000 / timeForSingleIteration) + countIterations
            if (logAfterCountIterations === Infinity) logAfterCountIterations = countIterations + 100_000

            while (process.env.isWorkerReady !== 'true') {
                process.stdout.write(".")
                await sleep(10)
            }
            console.log(`\n${process.env.log}`)

            postMessage(worker, 'found', {
                calcIterations,
                countIterations,
                currentNo: currentNo.value,
                endTime,
                iterationsNotFoundLimit,
                iterationsPerLog,
                maxSteps,
                messages,
                notFoundIterations,
                startSessionTime,
                startTime,
                startTimeLog,
            })
            messages = []
            startTimeLog = Date.now()
            iterationsPerLog = countIterations
        }
        currentNo.addOne(0)
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
