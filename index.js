/** Main entry: starts the search worker and prints its logs. */
// noinspection ES6UnusedImports
// import initConfig from '#Config/config.js'
import gaySchluffen from '#utils/gaySchluffen.js'
import {
    SHARE_ENV,
    Worker,
} from 'node:worker_threads'

/** @type {number} longest `setTimeout` delay; keeps the main thread alive */
const MAX_MILLISECONDS_FOR_TIMEOUT = 2_147_483_647

// noinspection JSCheckFunctionSignatures
const worker = new Worker(new URL(import.meta.resolve('#SearchWorker/index.js')), { env: SHARE_ENV })

worker.on('message', msg => {
    // eslint-disable-next-line no-console
    if (msg?.type === 'showLog') console.log(msg.text)
    if (msg?.type === 'ready') worker.postMessage({ type: 'run' })
})

worker.postMessage({ normalizedEnv: process.normalizedEnv, type: 'init' })

await gaySchluffen(MAX_MILLISECONDS_FOR_TIMEOUT)
