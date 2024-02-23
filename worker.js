import HugeInt from './HugeInt/index.js'
import calcCellsArrFactorial from './calcCellsArrFactorial.js'
import factorial from './factorial.js'
import logMultiPersistence from './MultiplicativePersistence/logMultiPersistence.js'
import { parentPort } from 'worker_threads'
import { setInitVars } from './Config/getInitVars.js'
import { threadId } from 'worker_threads'
let log
let VARS
let base
let approxFound = 0

const newStep = {
    atRunTime: 0,
    combinations: 0n,
    count: 0,
    first: 0,
    iteration: 0,
    last: 0,
    step: 0,
}

let onFound = (vars) => {
    const {steps: countSteps, number_lengths} = vars
    return ({
                atRunTime,
                calcIterations,
                currentNo,
                length,
                steps,
            }, startTime, endTime) => {
        const currentNoValue = currentNo.value

        if (!countSteps[steps]) {
            countSteps[steps] = {...newStep, step: steps}
        }
        const countStep = countSteps[steps]

        if (!countStep.count) {
            countStep.first = currentNoValue
        }
        const lengthsArr = currentNo.cellsArr.reduce((arr, cell) => {
            if (cell.count !== 1n) arr.push(cell.count)
            return arr
        }, [])

        const combinations = factorial(BigInt(length)) / calcCellsArrFactorial(lengthsArr)
        countStep.combinations += combinations
        countStep.count++
        countStep.last = currentNoValue
        countStep.atRunTime = atRunTime
        countStep.iteration = calcIterations

        if (!number_lengths[length]) {
            number_lengths[length] = {
                found: 0,
                time: endTime - startTime,
                steps: {}
            }
        }
        if (!number_lengths[length].steps[steps]) {
            number_lengths[length].steps[steps] = {
                count: 0, combinations: 0n, first: currentNoValue, last: 0n,
            }
        }
        number_lengths[length].steps[steps].last = currentNoValue
        number_lengths[length].steps[steps].count++
        number_lengths[length].steps[steps].combinations += combinations
        number_lengths[length].found++
    }
}

parentPort.on('message', async (messageObj) => {
    switch (messageObj.type) {
        case 'init':
            base = messageObj.data.base * 1n
            VARS = messageObj.data.VARS
            const goalNumber = new HugeInt(messageObj.data.goalNumber, base)
            log = logMultiPersistence({ goalNumber, base})
            onFound = onFound(VARS)
            break
        case 'found':
            const {
                calcIterations,
                countIterations,
                currentNo,
                endTime,
                iterationsNotFoundLimit,
                messages,
                notFoundIterations,
                startTime,
            } = messageObj.data

            messageObj.data.messagesCount = messages.length
            approxFound += messages.length

            for (const message of messages) {
                const currentNo = new HugeInt(0n, base)
                currentNo.fromString(message.currentNoStr, base)
                message.currentNo =  currentNo
                message.length = message.currentNoStr.length

                onFound(message, startTime, endTime)
            }

            VARS.iterations = {
                calculated: calcIterations,
                count: countIterations,
                found_nothing: notFoundIterations,
                found_nothing_break_at: iterationsNotFoundLimit,
            }

            VARS.last_number = currentNo
            VARS.up_time = endTime - startTime
            process.env.log = log(
                {...messageObj.data,
                    countSteps: VARS.steps,
                    lengths: VARS.number_lengths})
            delete messageObj.messages
            delete messageObj.data
            messageObj = null

            if (process.env.debug === 'false') {
                await setInitVars(VARS, base)
            }
            break
    }
    process.env.isWorkerReady = 'true'
})

