import HugeInt from './HugeInt/index.js'
import calcCellsArrFactorial from './calcCellsArrFactorial.js'
import factorial from './factorial.js'
import logMultiPersistence from './MultiplicativePersistence/logMultiPersistence.js'
import { parentPort } from 'worker_threads'
import { setInitVars } from './Config/getInitVars.js'

let log
let INIT_VARS
let base

let onFound = ({ countSteps }) => {

    const newStep = {
        atRunTime: 0,
        combinations: 0n,
        count: 0,
        first: 0,
        iteration: 0,
        last: 0,
        step: 0,
    }
    return ({
        atRunTime,
        calcIterations,
        currentNo,
        steps,
    }) => {
        if (!countSteps[steps]) {
            countSteps[steps] = { ...newStep, step: steps }
        }
        const countStep = countSteps[steps]

        if (!countStep.count) {
            countStep.first = currentNo.value
        }
        const lengthsArr = currentNo.cellsArr.reduce((arr, cell) => {
            if (cell.count !== 1n) arr.push(cell.count)
            return arr
        }, [])
        countStep.combinations += factorial(BigInt(currentNo.length)) / calcCellsArrFactorial(lengthsArr)
        countStep.count++
        countStep.last = currentNo.value
        countStep.atRunTime = atRunTime
        countStep.iteration = calcIterations
    }
}

parentPort.on('message', async (messageObj) => {
    switch (messageObj.type) {
        case 'init':
            base = messageObj.data.base * 1
            INIT_VARS = messageObj.data.INIT_VARS
            const goalNumber = new HugeInt(messageObj.data.goalNumber, base)
            log = logMultiPersistence({ goalNumber, base})
            onFound = onFound({ countSteps: INIT_VARS[base].STEPS})
            break
        case 'found':
            const {
                calcIterations,
                countIterations,
                currentNo,
                endTime,
                iterationsNotFoundLimit,
                lastNumberFound,
                maxSteps,
                messages,
                notFoundIterations,
                startTime,
            } = messageObj.data
            messages.forEach(message => onFound(message))

            INIT_VARS[base].COUNT_ITERATIONS = countIterations
            INIT_VARS[base].CALC_ITERATIONS = calcIterations
            INIT_VARS[base].ITERATIONS_NOT_FOUND = notFoundIterations
            INIT_VARS[base].ITERATIONS_NOT_FOUND_LIMIT = iterationsNotFoundLimit
            INIT_VARS[base].LAST_FOUND = lastNumberFound
            INIT_VARS[base].MAX_STEPS = maxSteps
            INIT_VARS[base].NUMBER = currentNo
            INIT_VARS[base].UP_TIME_MILLISECONDS = endTime - startTime
            log({...messageObj.data, countSteps: INIT_VARS[process.env.INIT_BASE].STEPS})
            if (process.env.DEBUG === 'false') {
                await setInitVars(INIT_VARS, base)
            }
            break
    }
    process.env.isWorkerReady = 'true'
})

