/**
 * Worker-thread entry point for the multiplicative-persistence search.
 *
 * Boots configuration and hands every incoming message to
 * {@link createMessageHandler}. All real work lives in the sibling modules:
 *  - `workerContext.js` — one-time `init` setup
 *  - `processFound.js`  — the `found` pipeline (drain, tally, log, persist)
 *  - `foundRecorder.js` — folding a found number into the running stats
 *
 * Coordination with the main thread is a single semaphore,
 * `process.env.isWorkerReady`, flipped to `'true'` after each message.
 */

import { initConfig } from '../Config/config.js'
import { parentPort } from 'worker_threads'
import { createMessageHandler } from './messageHandler.js'

initConfig()

parentPort.on('message', createMessageHandler())
