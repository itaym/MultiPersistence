import HugeInt from '../HugeInt/index.js'
import logMultiPersistence from '../MultiplicativePersistence/logMultiPersistence.js'
import { createFoundRecorder } from './foundRecorder.js'

/**
 * @typedef {import('../index.js').WorkerConfig} WorkerConfig
 * @typedef {import('../Config/computationStateIO.js').ComputationState} ComputationState
 * @typedef {import('./foundRecorder.js').FoundRecorder} FoundRecorder
 * @typedef {import('../utils/prepareMessage.js').FoundMessage} FoundMessage
 */

/**
 * Everything the worker builds once, on `init`, and reuses for every later
 * message. Replaces the module-level `let` state of the old single-file worker.
 *
 * @typedef {Object} WorkerContext
 * @property {BigInt} base                    numeric base for HugeInt operations
 * @property {ComputationState} computationState  the running search state, mutated in place and persisted
 * @property {(stats: Object) => string} log  log-string builder from {@link logMultiPersistence}
 * @property {FoundRecorder} recordFound      folds one found number into `computationState`
 * @property {number} startSessionTime        timestamp this session started (ms)
 * @property {number} startTime               session start adjusted for prior uptime (ms)
 * @property {FoundMessage[][]} stackMessages batches awaiting the next `found` tick
 */

/**
 * Builds the {@link WorkerContext} from the main thread's `init` payload.
 *
 * @param {WorkerConfig} config
 * @returns {WorkerContext}
 */
export const createWorkerContext = (config) => {
    const base = config.base
    const computationState = config.VARS
    const goalNumber = new HugeInt(config.goalNumber, base)

    return {
        base,
        computationState,
        log: logMultiPersistence({ goalNumber, base }),
        recordFound: createFoundRecorder(computationState),
        startSessionTime: config.startSessionTime,
        startTime: config.startTime,
        stackMessages: [],
    }
}
