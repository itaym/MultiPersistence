import './Config/config.js'
import HugeInt from './HugeInt/index.js'
import calcCellsArrFactorial from './utils/calcCellsArrFactorial.js'
import factorial from './utils/factorial.js'
import logMultiPersistence from './MultiplicativePersistence/logMultiPersistence.js'
import { parentPort } from 'worker_threads'
import { setInitVars } from './Config/getInitVars.js'

let log
let VARS
let base
let startSessionTime
let startTime
let stackMessages = []

let onFound = (vars) => {
    const  tbi = new Array(1_000)
    for (let int = 0; int < 1_000; int++) {
        tbi[int] = BigInt(int)
    }
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
        let cell = currentNo.firstCell
        while (cell) {
            if (cell.count !== 1n) lengthsArr.push(cell.count)
            cell = cell.next
        }

        if (lengthsArr.length === 0) lengthsArr.push(1n)

        const combinations = factorial(tbi[length]) / calcCellsArrFactorial(lengthsArr)
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
    const { data, type } = messageObj
    const { normalizedEnv } = process

    switch (type) {
        case 'init':
            base = data.base
            VARS = data.VARS
            startSessionTime = data.startSessionTime
            startTime = data.startTime
            const goalNumber = new HugeInt(data.goalNumber, base)
            log = logMultiPersistence({ goalNumber, base})
            onFound = onFound(VARS)
            break
        case 'stack':
            stackMessages.push(data.messages)
            delete messageObj.data
            break;
        case 'found':
            const {
                calcIterations,
                countIterations,
                currentNo,
                endTime,
                notFoundLimit,
                messages,
                notFound,
            } = data
            let noOfMessages = 0
            stackMessages.push(messages)
            for (let stackIndex = 0; stackIndex < stackMessages.length; stackIndex++) {
                for (let messageIndex = 0; messageIndex < stackMessages[stackIndex].length; messageIndex++) {
                    let message = stackMessages[stackIndex][messageIndex]
                    const currentNo = new HugeInt(0n, base)
                    currentNo.fromString(message.currentNoStr, base)

                    onFound(message, currentNo,  message.currentNoStr.length, startTime, endTime)
                }
                noOfMessages += stackMessages[stackIndex].length
            }
            stackMessages = []
            VARS.iterations = {
                calculated: calcIterations,
                count: countIterations,
                found_nothing: notFound,
                found_nothing_break_at: notFoundLimit,
            }

            VARS.last_number = currentNo
            VARS.up_time = endTime - startTime
            delete data.messages

            process.env.log = log(
                {...data,
                    countSteps: VARS.steps,
                    messagesCount: noOfMessages,
                    lengths: VARS.number_lengths,
                    startSessionTime,
                    startTime,
                })

            if (!normalizedEnv.debug) {
                await setInitVars(VARS, base)
            }
            break
    }
    process.env.isWorkerReady = 'true'
})
