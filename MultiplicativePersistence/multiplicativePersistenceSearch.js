import HugeInt from '../HugeInt/index.js'
import { multiPer, multiPerNoBaseCheck } from '../MultiplicativePersistence/multiplicativePersistence.js'
import needToCheck from '../MultiplicativePersistence/needToCheck.js'
import onNotModuloBase from '../MultiplicativePersistence/onNotModulo10.js'
import postMessage from '../utils/postMessage.js'
import sleep from '../utils/sleep.js'

class ToPrimitive {
    constructor(obj) {
        this.obj = obj
        this.fn = needToCheck.bind(null, this.obj)
    }
    [Symbol.toPrimitive]() {
        return 1n + this.fn();
    }
}

export const multiplicativePersistenceSearch = async (initVars, startSessionTime, startTime, worker) => {

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
    let maxSteps = stepsObj.length - 1
    let notFoundIterations = iterations.found_nothing

    let notToBreakCondition = iterationsNotFoundLimit > notFoundIterations
    let endTime
    let iterationsPerLog = countIterations
    let messages = []
    let multiPerFn = multiPer
    let startTimeLog = startSessionTime
    let steps = 2

    const createPermutations = needToCheck.supported.includes(process.selfEnv.base)
        ? new ToPrimitive(currentNo) : 1n

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

        calcIterations += createPermutations
        countIterations++

        steps = multiPerFn(currentNo, baseNumber)

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

        if ((countIterations > logAfterCountIterations) || messages.length === 80_000) {
            endTime = Date.now()
            const currentNoValue = currentNo.value
            if (currentNoValue > base) {
                multiPerFn = multiPerNoBaseCheck
            }
            iterationsPerLog = countIterations - iterationsPerLog

            const timeForIterations = endTime - startTimeLog
            const timeForSingleIteration = timeForIterations / iterationsPerLog
            logAfterCountIterations = Math.floor(2_000 / timeForSingleIteration) + countIterations
            if (logAfterCountIterations === Infinity) logAfterCountIterations = countIterations + 100_000

            while (process.env.isWorkerReady !== 'true') {
                process.stdout.write(".")
                await sleep(20)
            }
            console.log(`\n${process.env.log}`)

            if (postMessage(worker, 'found', {
                calcIterations,
                countIterations,
                currentNo: currentNoValue,
                endTime,
                iterationsNotFoundLimit,
                iterationsPerLog,
                maxSteps,
                messages,
                notFoundIterations,
                startTimeLog,
            })) messages = []
            startTimeLog = Date.now()
            iterationsPerLog = countIterations
        }
        currentNo.addOne(0)
    }
    endTime = Date.now()

    while (process.env.isWorkerReady !== 'true') {
        await sleep(10)
    }
    currentNo.subtractOne(0)
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
        startTimeLog,
    })
    while (process.env.isWorkerReady !== 'true') {
        await sleep(10)
    }
    console.log(process.env.log)
    console.log('---------- FINISH ----------')
}
