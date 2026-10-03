import HugeIntEx from '#HugeIntEx/index.js'
import logMultiPersistence from '#MultiplicativePersistence/logMultiPersistence.js'
import createFoundRecorder from './foundRecorder.js'

/**
 * Builds the persist worker's context from its `init` config.
 *
 * @param {WorkerConfig} config
 * @returns {WorkerContext}
 */
const createWorkerContext = config => {
    const { base } = config
    const computationState = config.VARS
    const pseudoGoalNumber = new HugeIntEx(base, undefined, config.pseudoGoalNumber)

    return {
        base,
        computationState,
        log: logMultiPersistence({ base, pseudoGoalNumber }),
        pseudoGoal: config.pseudoGoal,
        range_start: config.range_start,
        recordFound: createFoundRecorder(computationState),
        stackMessages: [],
        startSessionTime: config.startSessionTime,
        startTime: config.startTime,
    }
}

export default createWorkerContext
