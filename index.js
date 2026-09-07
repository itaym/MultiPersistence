/**
 * Main entry point for the Multiplicative Persistence search process.
 *
 * Responsibilities:
 * 1. Initialize configuration and polyfills (side‑effect imports).
 * 2. Set up shared environment variables used for lightweight communication
 *    between the main thread and the worker thread.
 * 3. Spawn the worker thread with a shared environment (SHARE_ENV).
 * 4. Load initialization variables and construct the goal number.
 * 5. Send an initialization message to the worker containing all runtime data.
 * 6. Perform a minimal‑overhead readiness check:
 *      - In most cases the worker is already ready.
 *      - If not, the loop sleeps briefly and prints any worker log output.
 * 7. Start the main multiplicative persistence search.
 * 8. Terminate the worker and print a completion banner.
 *
 * This file intentionally avoids blocking the main thread while waiting
 * for the worker. Instead, it uses shared environment variables as a
 * fast readiness signal, keeping the main script running without delay.
 *
 * @module MainIndex
 *
 * @throws {Error}
 *     If configuration is invalid or the worker fails to initialize.
 */

/**
 * Payload sent to the worker on the `init` message.
 *
 * @typedef {Object} WorkerConfig
 * @property {BigInt} base              numeric base used for HugeInt operations
 * @property {BigInt} goalNumber        target number for the persistence search
 * @property {number} startSessionTime  timestamp (ms) when this session began
 * @property {number} startTime         session start adjusted for prior uptime (ms)
 * @property {import('./Config/computationStateIO.js').ComputationState} VARS  the worker's starting computation state
 */
import HugeInt from './HugeInt/index.js'
import postMessages from './utils/postMessage.js'
import { Worker, SHARE_ENV } from 'worker_threads'
import { getComputationState } from './Config/computationStateIO.js'
import { initConfig } from './Config/config.js'
import { initPollyFill } from './utils/pollyfill.js'
import { multiPerSearch } from './MultiplicativePersistence/index.js'
import waitShowLog from './utils/waitShowLog.js'
// import Cache from './utils/Cache.js'

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
    goalNumber: goalNumber.value,
    startSessionTime,
    startTime,
    VARS: {
        ...computationState,
    },
}

postMessages( worker, 'init', workerConfig)

while (process.env.isWorkerReady !== 'true') {
    await waitShowLog(100)
}

// noinspection JSCheckFunctionSignatures
await multiPerSearch(check_interval_count, checkpoint_interval, computationState, log_interval, startSessionTime, startTime, worker)
await worker.terminate()
console.log('---------- FINISH ----------')