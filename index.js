/** config must be the first import. It initializes the environment variables */
import './Config/config.js'
/** ------------------------------------------------------------------------ */

import HugeInt from './HugeInt/index.js'
import calcCellsArrFactorial from './calcCellsArrFactorial.js'
import chalk from 'chalk'
import factorial from './factorial.js'
import getTimeString from './getTimeString.js'
import logMultiPersistence, { fromMiddleStringMaxLength }from './MultiplicativePersistence/logMultiPersistence.js'
import multiPer from './MultiplicativePersistence/multiplicativePersistence.js'
import needToCheck from './MultiplicativePersistence/needToCheck.js'
import onNotModulo10 from './MultiplicativePersistence/onNotModulo10.js'
import { getInitVars, setInitVars } from './Config/getInitVars.js'

const colors = ['white', 'yellow']
let currentColor = 1

const getColor = () => {
    currentColor = 1 - currentColor
    return colors[currentColor]
}

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
 * @param STEPS
 * @param UP_TIME_MILLISECONDS
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
    STEPS,
    UP_TIME_MILLISECONDS,
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
    let goalNumber = new HugeInt(selfEnv.INIT_GOAL_NUMBER, base)
    let lastNumberFound = new HugeInt(LAST_FOUND?.value || 0, base)
    let logAfterCountIterations = countIterations + 1000
    let maxSteps = MAX_STEPS || selfEnv.INIT_MAX_STEPS
    let calcIterations = CALC_ITERATIONS || selfEnv.INIT_CALC_ITERATIONS
    let upTime = UP_TIME_MILLISECONDS || selfEnv.INIT_UP_TIME_MILLISECONDS
    let iterationsNotFoundLimit = ITERATIONS_NOT_FOUND_LIMIT || 10_000_000
    let notFoundIterations = ITERATIONS_NOT_FOUND || 0

    let breakCondition = true
    let endTime
    let iterationsPerLog = countIterations
    let startTime = Date.now() - upTime
    let startTimeLog = Date.now()
    let steps = 0


    const countSteps = STEPS
    const log = await logMultiPersistence({goalNumber, currentNo, base})

    /**
     * Start (or continue) the Multiplicative Persistence search
     */
    while (breakCondition) {

        onNotModulo10(currentNo)
        const { permutationsSaved, skip } = needToCheck(currentNo)

        steps = 2
        if (!skip) steps = multiPer(currentNo, base)

        calcIterations += permutationsSaved + 1n
        countIterations++

        if (steps !== 2) {
            iterationsNotFoundLimit = Math.max(countIterations, iterationsNotFoundLimit)
            notFoundIterations = 0

            if (!countSteps[steps]) {
                countSteps[steps] = {
                    atRunTime: 0,
                    combinations: 0n,
                    count: 0,
                    first: 0,
                    iteration: 0,
                    last: 0,
                    step: steps,
                }
            }
            const countStep = countSteps[steps]

            if (!countStep.count) {
                countStep.first = currentNo.clone()
            }
            const lengthsArr = currentNo.cellsArr.reduce((arr, cell) => {
                if (cell.count !== 1) arr.push(cell.count)
                return arr
            }, [])
            countStep.combinations += factorial(BigInt(currentNo.length)) / calcCellsArrFactorial(lengthsArr)
            countStep.count++
            countStep.last = currentNo.clone()
            countStep.atRunTime = Date.now() - startTime
            countStep.iteration = calcIterations
        }
        else {
            notFoundIterations++
            breakCondition = iterationsNotFoundLimit > notFoundIterations
        }

        if ((countIterations > logAfterCountIterations) || (steps > maxSteps)) {
            endTime = Date.now()

            if (steps > maxSteps) {
                maxSteps = steps
                lastNumberFound = currentNo.clone()
            }
            INIT_VARS[base].COUNT_ITERATIONS = countIterations
            INIT_VARS[base].CALC_ITERATIONS = calcIterations
            INIT_VARS[base].ITERATIONS_NOT_FOUND = notFoundIterations
            INIT_VARS[base].ITERATIONS_NOT_FOUND_LIMIT = iterationsNotFoundLimit
            INIT_VARS[base].LAST_FOUND = lastNumberFound
            INIT_VARS[base].MAX_STEPS = maxSteps
            INIT_VARS[base].NUMBER = currentNo.clone()
            INIT_VARS[base].UP_TIME_MILLISECONDS = endTime - startTime
            !process.selfEnv.DEBUG ? await setInitVars(INIT_VARS, base) : void 0

            iterationsPerLog = countIterations - iterationsPerLog

            const timeForIterations = endTime - startTimeLog
            const timeForSingleIteration = timeForIterations / iterationsPerLog
            logAfterCountIterations = Math.floor(2000 / timeForSingleIteration) + countIterations
            if (logAfterCountIterations === Infinity) logAfterCountIterations = countIterations + 10_000

            log({
                calcIterations,
                countIterations,
                currentNo,
                endTime,
                iterationsNotFoundLimit,
                iterationsPerLog,
                lastNumberFound,
                maxSteps,
                notFoundIterations,
                startTime,
                startTimeLog,
            })

            const countLog = []
            for (let index in countSteps) {
                let cs = countSteps[index]
                if (cs?.count) {
                    countLog.push((index + '').padStart(2, '0').padEnd(5, ' =>') +
                        `${(cs.count.toLocaleString() + '').padStart(18, ' ')}, ${fromMiddleStringMaxLength(cs.combinations.toLocaleString(), 39).padStart(45, ' ')}, ${(cs.iteration.toLocaleString() + '').padStart(18, ' ')}. ${getTimeString(endTime - cs.atRunTime - startTime)} (${(calcIterations - cs.iteration).toLocaleString()})`)
                    }
            }
            currentColor = 1
            countLog.forEach(logString => console.log(chalk[getColor()](logString)))

            startTimeLog = Date.now()
            iterationsPerLog = countIterations
        }
        if (breakCondition) currentNo.addOne()
    }
    endTime = Date.now()

    log({
        calcIterations,
        countIterations,
        currentNo,
        endTime,
        iterationsNotFoundLimit,
        iterationsPerLog,
        lastNumberFound,
        maxSteps,
        notFoundIterations,
        startTime,
        startTimeLog,
    })
    INIT_VARS[base].CALC_ITERATIONS = calcIterations
    INIT_VARS[base].ITERATIONS_NOT_FOUND = notFoundIterations
    INIT_VARS[base].ITERATIONS_NOT_FOUND_LIMIT = iterationsNotFoundLimit
    INIT_VARS[base].LAST_FOUND = lastNumberFound
    INIT_VARS[base].MAX_STEPS = maxSteps
    INIT_VARS[base].NUMBER = currentNo
    INIT_VARS[base].UP_TIME_MILLISECONDS = endTime - startTime
    !process.selfEnv.DEBUG ? await setInitVars(INIT_VARS, base) : void 0

    console.log('---------- FINISH ----------')
}

const INIT_VARS = !process.selfEnv.DEBUG ? await getInitVars(process.selfEnv.INIT_BASE) : {}
if (!INIT_VARS[process.selfEnv.INIT_BASE]) {
    INIT_VARS[process.selfEnv.INIT_BASE] = {
        BASE: process.selfEnv.INIT_BASE,
        COUNT_ITERATIONS: 0,
        CALC_ITERATIONS: 0,
        ITERATIONS_NOT_FOUND: 0,
        ITERATIONS_NOT_FOUND_LIMIT: 1_00_000_000,
        LAST_FOUND: new HugeInt(0),
        MAX_STEPS: -1,
        NUMBER: process.selfEnv.INIT_NUMBER,
        UP_TIME_MILLISECONDS: process.selfEnv.INIT_UP_TIME_MILLISECONDS,
        STEPS: []
    }
}

await multiplicativePersistenceSearch(INIT_VARS[process.selfEnv.INIT_BASE])