import './Config/config.js'
import HugeInt from './HugeInt/index.js'
import calcCellsArrFactorial from './utils/calcCellsArrFactorial.js'
import factorial from './utils/factorial.js'
import logMultiPersistence from './MultiplicativePersistence/logMultiPersistence.js'
import { parentPort } from 'worker_threads'
import { setInitVars } from './Config/getInitVars.js'

let base
let initVars
let log
let onFound
let startSessionTime
let startTime
/** @type {FoundMessage[]} */
let stackMessages = []

/**
 * @typedef {function} onFoundCallback
 * @param {FoundMessage} foundMessage
 * @param {HugeInt} currentNo
 * @param {number} length
 * @param {number} startTime
 * @param {number} endTime
 */

/**
 *
 * @param {HugeInt} currentNo
 * @return {bigint[]}
 */
const createLengthsArray = (currentNo) => {
    const array = []
    let cell = currentNo.firstCell
    while (cell) {
        if (cell.count !== 1n) array.push(cell.count)
        cell = cell.next
    }

    if (array.length === 0) array.push(1n)
    return array
}

/**
 *
 * @param {InitVars} initVars
 * @returns {onFoundCallback}
 */
const onFoundCreator = (initVars) => {
    const {steps: countSteps, number_lengths} = initVars

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
        const lengthsArr = createLengthsArray(currentNo)
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

/**
 *
 * @typedef InitData
 * @property {string} type
 * @property data
 */

/**
 *
 * @typedef MessageObj
 * @property {string} type
 * @property data
 */

/**
 *
 * @param messageObj
 * @returns {Promise<void>}
 */
const onMessage =  async (messageObj) => {
    const {data, type} = messageObj
    const {normalizedEnv} = process

    switch (type) {
        case 'init':
            base = data.base
            initVars = data.initVars
            startSessionTime = data.startSessionTime
            startTime = data.startTime
            const goalNumber = new HugeInt(data.goalNumber, base)
            log = logMultiPersistence({goalNumber, base})
            onFound = onFoundCreator(initVars)
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

                    onFound(message, currentNo, message.currentNoStr.length, startTime, endTime)
                }
                noOfMessages += stackMessages[stackIndex].length
            }
            stackMessages = []
            initVars.iterations = {
                calculated: calcIterations,
                count: countIterations,
                found_nothing: notFound,
                found_nothing_break_at: notFoundLimit,
            }

            initVars.last_number = currentNo
            initVars.up_time = endTime - startTime
            delete data.messages

            process.env.log = log(
                {
                    ...data,
                    countSteps: initVars.steps,
                    messagesCount: noOfMessages,
                    lengths: initVars.number_lengths,
                    startSessionTime,
                    startTime,
                })

            if (!normalizedEnv.debug) {
                await setInitVars(initVars, base)
            }
            break
    }
    process.env.isWorkerReady = 'true'
}

parentPort.on('message', onMessage)
