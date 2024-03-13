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
        for (let x = 0; x < currentNo.cellsArr.length; x++) {
            let count= currentNo.cellsArr[x].count
            if (count !== 1n) lengthsArr.push(count)
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
    switch (messageObj.type) {
        case 'init':
            base = messageObj.data.base * 1n
            VARS = messageObj.data.VARS
            startSessionTime = messageObj.data.startSessionTime * 1
            startTime = messageObj.data.startTime * 1
            const goalNumber = new HugeInt(messageObj.data.goalNumber, base)
            log = logMultiPersistence({ goalNumber, base})
            onFound = onFound(VARS)
            break
        case 'stack':
            stackMessages.push(messageObj.data.messages)
            delete messageObj.messages
            delete messageObj.data
            messageObj = null
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
            } = messageObj.data
            let noOfMessages = 0
            stackMessages.push(messages)
            for (let stackIndex = 0; stackIndex < stackMessages.length; stackIndex++) {
                for (let messageIndex = 0; messageIndex < stackMessages[stackIndex].length; messageIndex++) {
                    let message = stackMessages[stackIndex][messageIndex]
                    noOfMessages++
                    const currentNo = new HugeInt(0n, base)
                    currentNo.fromString(message.currentNoStr, base)

                    onFound(message, currentNo,  message.currentNoStr.length, startTime, endTime)
                }
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
            delete messageObj.messages

            process.env.log = log(
                {...messageObj.data,
                    countSteps: VARS.steps,
                    messagesCount: noOfMessages,
                    lengths: VARS.number_lengths,
                    startSessionTime,
                    startTime,
                })

            delete messageObj.data
            messageObj = null

            if (process.env.debug === 'false') {
                await setInitVars(VARS, base)
            }
            break
    }
    process.env.isWorkerReady = 'true'
})
