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
 * @property {import('./Config/computationStateIO.js').ComputationState} VARS  the worker's starting computation state
 * @property {BigInt} base              numeric base used for HugeInt operations
 * @property {BigInt} goalNumber        target number for the persistence search
 * @property {number} startSessionTime  timestamp (ms) when this session began
 * @property {number} startTime         session start adjusted for prior uptime (ms)
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

// let a = new HugeInt(9999n ** 99999n, 16n)
// let b = new HugeInt(9999n ** 99999n, 16n)
//
// a.add(b)
//
// console.log(a.toLocaleString(), a.cellsLength, a.length)
//
//
// async function testCache() {
//     console.log('=== Cache Test Suite ===')
//
//     const sleep = ms => new Promise(r => setTimeout(r, ms))
//
//     const cache = new Cache({ maxSize: 3, expireIn: 50 }, 'test-cache')
//
//     console.log('\n1. Test basic set/get')
//     cache.set("a", 1)
//     console.log("get(a) =", cache.get("a")) // expect 1
//
//     console.log("\n2. Test expiration")
//     cache.set("b", 2)
//     await sleep(60)
//     console.log("get(b) after expiration =", cache.get("b")) // expect undefined
//
//     console.log("\n3. Test sliding expiration")
//     cache.set("c", 3)
//     await sleep(30)
//     console.log("get(c) mid-way =", cache.get("c")) // refresh TTL
//     await sleep(30)
//     console.log("get(c) after refresh =", cache.get("c")) // should still exist
//
//     console.log("\n4. Test LFU eviction")
//     cache.set("x", "X")
//     cache.set("y", "Y")
//     cache.set("z", "Z")
//
//     // Access x twice, y once, z never
//     cache.get("x")
//     cache.get("x")
//     cache.get("y")
//
//     console.log("Counts before eviction:")
//     console.log("x =", cache.get("x"))
//     console.log("y =", cache.get("y"))
//     console.log("z =", cache.get("z"))
//
//     console.log("\nInsert new item to trigger LFU eviction")
//     cache.set("new", "NEW")
//
//     console.log("Cache keys after LFU eviction:", [...cache.keys()])
//     // expect "z" to be evicted (lowest count)
//
//     console.log("\n5. Test replacing expired entries")
//     cache.set("temp", "TEMP")
//     await sleep(60)
//     cache.set("temp", "TEMP2")
//     console.log("get(temp) =", cache.get("temp")) // expect TEMP2
//
//     console.log("\n6. Test maxSize enforcement + error")
//     const smallCache = new Cache({ maxSize: 1, expireIn: 100 }, "small")
//
//     smallCache.set("a", 1)
//     try {
//         smallCache.set("b", 2) // should throw
//         console.log("ERROR: did not throw")
//     } catch (err) {
//         console.log("Correctly threw:", err.message)
//     }
//
//     console.log("\n=== Test Suite Complete ===")
// }
// await testCache()
// process.exit()

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

const goalNumber = new HugeInt(normalizedEnv.goal_number, normalizedEnv.base)
const log_interval = normalizedEnv['log_interval']
const startSessionTime = Date.now()
const startTime = startSessionTime - computationState.up_time

/** @type {WorkerConfig} */
const workerConfig = {
    VARS: {
        ...computationState,
    },
    base:  normalizedEnv.base,
    goalNumber: goalNumber.value,
    startSessionTime,
    startTime,
}

postMessages( worker, 'init', workerConfig)

while (process.env.isWorkerReady !== 'true') {
    await waitShowLog(100)
}

// noinspection JSCheckFunctionSignatures
await multiPerSearch(computationState, log_interval, startSessionTime, startTime, worker)
await worker.terminate()
console.log('---------- FINISH ----------')