/**
 * Search worker: on a `run` message from the main thread, spawns the persist worker, loads
 * the computation state, runs {@link multiPerSearch}, then terminates the persist worker.
 * Coordinates with the persist worker through `process.env` rather than blocking on it.
 *
 * @module SearchWorker
 */

/**
 * Payload sent to the worker on the `init` message.
 *
 * @typedef {Object} WorkerConfig
 * @property {BigInt} base numeric base used for HugeInt operations
 * @property {BigInt} goal exclusive upper bound of this run's range
 * @property {BigInt} goalNumber target number for the persistence search
 * @property {BigInt} range_start inclusive lower bound of this run's range (`0n` in continuous mode)
 * @property {number} startSessionTime timestamp (ms) when this session began
 * @property {number} startTime session start adjusted for prior uptime (ms)
 * @property {import('./Config/computationStateIO.js').ComputationState} VARS the worker's starting computation state
 */
import HugeInt from './HugeInt/index.js'
import postMessages from './utils/postMessage.js'
import { Worker, SHARE_ENV, parentPort } from 'worker_threads'
import { getComputationState } from './Config/computationStateIO.js'
import { initConfig } from './Config/config.js'
import { initPollyFill } from './utils/pollyfill.js'
import { multiPerSearch } from './MultiplicativePersistence/index.js'
import showLog from './utils/showLog.js'
import waitForWorker from './utils/waitForWorker.js'

const run = async () => {
    initConfig()
    initPollyFill()

    const { env, normalizedEnv } = process

    env.isWorkerReady = 'false'
    env.log = ''

    // noinspection JSCheckFunctionSignatures
    const worker = new Worker('./worker/index.js', {
        'env': SHARE_ENV,
        resourceLimits: {
            maxOldGenerationSizeMb: 32_768
        },
    })

    let computationState = await getComputationState()

    const check_interval_count = normalizedEnv.check_interval_count
    const checkpoint_interval = normalizedEnv.checkpoint_interval
    const goalNumber = new HugeInt(normalizedEnv.goal_number, normalizedEnv.base)
    const log_interval = normalizedEnv.log_interval
    const startSessionTime = Date.now()
    const startTime = startSessionTime - computationState.up_time

    /** @type {WorkerConfig} */
    const workerConfig = {
        base:  normalizedEnv.base,
        goal: computationState.goal,
        goalNumber: goalNumber.value,
        range_start: computationState.range_start,
        startSessionTime,
        startTime,
        VARS: {
            ...computationState,
        },
    }

    postMessages( worker, 'init', workerConfig)

    while (process.env.isWorkerReady !== 'true') {
        await waitForWorker(100)
    }

    // noinspection JSCheckFunctionSignatures
    await multiPerSearch(check_interval_count, checkpoint_interval, computationState, log_interval, startSessionTime, startTime, worker)
    await worker.terminate()
    showLog('---------- FINISH ----------')
}

parentPort.on('message', (msg) => {
    if (msg?.type === 'run') run()
})
