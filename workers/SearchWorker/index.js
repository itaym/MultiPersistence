/**
 * Search worker: `init` stores the config sent by main, `run` spawns the persist worker, runs
 * {@link multiPerSearch}, then terminates the persist worker. Coordinates with the persist
 * worker through `process.env` rather than blocking on it.
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
 * @property {import('#Config/computationStateIO.js').ComputationState} VARS the worker's starting computation state
 */
import HugeInt from '#HugeInt/index.js'
import { Worker, SHARE_ENV, parentPort } from 'worker_threads'
import gaySchluffen from '#utils/gaySchluffen.js'
import { getComputationState } from '#Config/computationStateIO.js'
import { initPollyFill } from '#utils/pollyfill.js'
import { multiPerSearch } from '#MultiplicativePersistence/index.js'
import postMessages from '#utils/postMessage.js'
import showLog from '#utils/showLog.js'
import waitForWorker from '#utils/waitForWorker.js'

initPollyFill()

/**
 * Spawns the persist worker, runs {@link multiPerSearch}, then terminates the persist worker.
 *
 * @param {NormalizedEnv} normalizedEnv config sent by main over the `init` message
 * @returns {Promise<void>}
 */
const run = async (normalizedEnv) => {

    const { env } = process

    env.isWorkerReady = 'false'
    env.log = ''

    // noinspection JSCheckFunctionSignatures
    const worker = new Worker(new URL(import.meta.resolve('#workers/PersistWorker/index.js')), {
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

    const tick = () => gaySchluffen(0)

    // noinspection JSCheckFunctionSignatures
    await multiPerSearch(check_interval_count, checkpoint_interval, computationState, log_interval, startSessionTime, startTime, tick, worker)
    await worker.terminate()
    showLog('---------- FINISH ----------')
}

/**
 * Stores the config sent by main and signals readiness.
 *
 * @param {{normalizedEnv: NormalizedEnv}} msg init message payload
 * @returns {void}
 */
const init = (msg) => {
    process.normalizedEnv = msg.normalizedEnv
    parentPort.postMessage({ type: 'ready' })
}

parentPort.on('message', (msg) => {
    if (msg?.type === 'init') init(msg)
    if (msg?.type === 'run') run(process.normalizedEnv).then()
    if (msg?.type === 'debugger')
        debugger
})
