/**
 * Worker-thread entry point: boots config and routes every message to {@link createMessageHandler}.
 * Work lives in the siblings: `workerContext.js` (init), `processFound.js` (the `found` pipeline),
 * `foundRecorder.js` (folding a number into the stats).
 */

import { initConfig } from '../Config/config.js'
import { parentPort } from 'worker_threads'
import { createMessageHandler } from './messageHandler.js'

initConfig()

parentPort.on('message', createMessageHandler())
