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
 * @typedef {Object} InitVars
 * @property {number} up_time
 *     Milliseconds of previous session uptime, used to compute the adjusted
 *     start time for the current session.
 * @property {number} [other]
 *     Additional initialization fields returned by getInitVars().
 *
 * @typedef {Object} WorkerInitPayload
 * @property {InitVars} VARS
 *     Initialization variables for the worker.
 * @property {number} base
 *     Numerical base used for HugeInt operations.
 * @property {string} goalNumber
 *     The target number (as a string) for the persistence search.
 * @property {number} startSessionTime
 *     Timestamp (ms) when the current session began.
 * @property {number} startTime
 *     Adjusted timestamp including previous uptime.
 *
 * @typedef {Object} MultiPerSearchParams
 * @property {InitVars} initVars
 * @property {number} logInterval
 * @property {number} startSessionTime
 * @property {number} startTime
 * @property {Worker} worker
 *
 * @throws {Error}
 *     If configuration is invalid or the worker fails to initialize.
 */
import HugeInt from './HugeInt/index.js'
import postMessages from './utils/postMessage.js'
import { Worker, SHARE_ENV } from 'worker_threads'
import { getInitVars } from './Config/getInitVars.js'
import { initConfig } from './Config/config.js'
import { initPollyFill } from './utils/pollyfill.js'
import { multiPerSearch } from './MultiplicativePersistence/index.js'
import waitShowLog from "./utils/waitShowLog.js";

initConfig()
initPollyFill()

const { env, normalizedEnv } = process

env.isWorkerReady = 'false'
env.log = ''

// noinspection JSCheckFunctionSignatures
const worker = new Worker('./worker.js', {
    'env': SHARE_ENV,
    resourceLimits: {
        maxOldGenerationSizeMb: 32_768
    },
})

let initVars = await getInitVars()

const goalNumber = new HugeInt(normalizedEnv.goal_number, normalizedEnv.base)
const log_interval = normalizedEnv['log_interval']
const startSessionTime = Date.now()
const startTime = startSessionTime - initVars.up_time

postMessages( worker, 'init', {

        VARS: {
        ...initVars,
        },
        base:  normalizedEnv.base,
        goalNumber: goalNumber.value,
        startSessionTime,
        startTime,
    })

while (process.env.isWorkerReady !== 'true') {
    await waitShowLog(100)
}

// noinspection JSCheckFunctionSignatures
await multiPerSearch(initVars, log_interval, startSessionTime, startTime, worker)
await worker.terminate()
console.log('---------- FINISH ----------')