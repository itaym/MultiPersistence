/** config must be the first import. It initializes the environment variables */
import './Config/config.js'
/** ------------------------------------------------------------------------- */
import './utils/pollyfill.js'
/** ------------------------------------------------------------------------- */
import HugeInt from './HugeInt/index.js'
import { Worker, SHARE_ENV } from 'worker_threads'
import { getInitVars } from './Config/getInitVars.js'
import { multiPerSearch } from './MultiplicativePersistence/index.js'
import postMessages from './utils/postMessage.js'
import gaySchluffen from './utils/sleep.js'

const { env, selfEnv } = process

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

const goalNumber = new HugeInt(selfEnv.goal_number, selfEnv.base)
const log_interval = selfEnv.log_interval
const startSessionTime = Date.now()
const startTime = startSessionTime - initVars.up_time
postMessages( worker, 'init', {
    VARS: {
        ...initVars,
    },
    base:  selfEnv.base,
    goalNumber: goalNumber.value,
    startSessionTime,
    startTime,
})
while (process.env.isWorkerReady !== 'true') {
    console.log(`\n${process.env.log}`)
    await gaySchluffen(100)
}

// noinspection JSCheckFunctionSignatures
await multiPerSearch(initVars, log_interval, startSessionTime, startTime, worker)
worker.terminate()
console.log('---------- FINISH ----------')