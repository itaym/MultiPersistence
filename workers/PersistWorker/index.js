/** Persist worker entry: loads the config and routes parent messages to the message handler. */
import initConfig from '#Config/config.js'
import createMessageHandler from './messageHandler.js'
import { parentPort } from 'node:worker_threads'

initConfig()

parentPort.on('message', createMessageHandler())
