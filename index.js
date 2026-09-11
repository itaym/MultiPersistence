/**
 * Main entry point: spawns the search worker and parks.
 *
 * @module MainIndex
 */
import { Worker, SHARE_ENV } from 'worker_threads'
import gaySchluffen from '#utils/gaySchluffen.js'
// noinspection ES6UnusedImports
import { initConfig } from '#Config/config.js'

const MAX_MILLISECONDS_FOR_TIMEOUT = 2_147_483_647

// noinspection JSCheckFunctionSignatures
const worker = new Worker(new URL(import.meta.resolve('#workers/SearchWorker/index.js')), { env: SHARE_ENV })

worker.on('message', (msg) => {
    if (msg?.type === 'showLog') console.log(msg.text)
    if (msg?.type === 'ready') worker.postMessage({ type: 'run' })
})

worker.postMessage({ type: 'init', normalizedEnv: process.normalizedEnv })

await gaySchluffen(MAX_MILLISECONDS_FOR_TIMEOUT)
