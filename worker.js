import HugeInt from './HugeInt/index.js'
import calcCellsArrFactorial from './utils/calcCellsArrFactorial.js'
import factorial from './utils/factorial.js'
import logMultiPersistence from './MultiplicativePersistence/logMultiPersistence.js'
import { parentPort } from 'worker_threads'
import { setInitVars } from './Config/getInitVars.js'

let log
let VARS
let base

let onFound = (vars) => {
    const {steps: countSteps, number_lengths} = vars
    return ({
            atRunTime,
            calcIterations,
            steps,
        }, currentNo, length, startTime, endTime) => {
        const currentNoValue = currentNo.value

        if (!countSteps[steps]) {
            countSteps[steps] = {
                atRunTime: atRunTime,
                combinations: 0n,
                count: 0,
                first: currentNoValue,
                iteration: 0,
                last: 0,
                step: steps,
            }
        }
        const countStep = countSteps[steps]

        const lengthsArr = []
        for (let x = 0; x < currentNo.cellsArr.length; x++) {
            let { count } = currentNo.cellsArr[x]
            if (count !== 1n) lengthsArr.push(count)
        }
        lengthsArr.sort()
        if (lengthsArr.length === 0) lengthsArr.push(1n)

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
        const number_length = number_lengths[length]
        if (!number_length.steps[steps]) {
            number_length.steps[steps] = {
                count: 0, combinations: 0n, first: currentNoValue, last: 0n,
            }
        }
        const number_length_steps = number_lengths[length].steps[steps]
        number_length_steps.last = currentNoValue
        number_length_steps.count++
        number_length_steps.combinations += combinations
        number_length.found++
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

            for (const message of messages) {
                const currentNo = new HugeInt(0n, base)
                currentNo.fromString(message.currentNoStr, base)

                onFound(message, currentNo,  message.currentNoStr.length, startTime, endTime)
            }

            VARS.iterations = {
                calculated: calcIterations,
                count: countIterations,
                found_nothing: notFoundIterations,
                found_nothing_break_at: iterationsNotFoundLimit,
            }

            VARS.last_number = currentNo
            VARS.up_time = endTime - startTime
            delete messageObj.messages

            process.env.log = log(
                {...messageObj.data,
                    countSteps: VARS.steps,
                    messagesCount: messages.length,
                    lengths: VARS.number_lengths})

            delete messageObj.data
            messageObj = null

            if (process.env.debug === 'false') {
                await setInitVars(VARS, base)
            }
            break
    }
    process.env.isWorkerReady = 'true'
})
