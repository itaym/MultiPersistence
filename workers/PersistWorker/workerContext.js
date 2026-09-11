import HugeInt from '#HugeInt/index.js'
import logMultiPersistence from '#MultiplicativePersistence/logMultiPersistence.js'
import { createFoundRecorder } from './foundRecorder.js'

/**
 * Everything the worker builds once, on `init`, and reuses for every later message.
 *
 * @typedef {Object} WorkerContext
 * @property {BigInt} base numeric base for HugeInt operations
 * @property {ComputationState} computationState running search state, mutated in place and persisted
 * @property {BigInt} goal exclusive upper bound of this run's range
 * @property {(stats: Object) => string} log log-string builder from {@link logMultiPersistence}
 * @property {BigInt} range_start inclusive lower bound of this run's range
 * @property {FoundRecorder} recordFound folds one found number into `computationState`
 * @property {number} startSessionTime timestamp this session started (ms)
 * @property {number} startTime session start adjusted for prior uptime (ms)
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
        goal: config.goal,
        log: logMultiPersistence({ base, goalNumber }),
        range_start: config.range_start,
        recordFound: createFoundRecorder(computationState),
        startSessionTime: config.startSessionTime,
        startTime: config.startTime,
        stackMessages: [],
    }
}
