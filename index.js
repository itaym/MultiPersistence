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
import gaySchluffen from './utils/gaySchluffen.js'

const { env, normalizedEnv } = process

env.isWorkerReady = 'false'
env.log = ''

const worker = new Worker('./worker.js', {
    'env': SHARE_ENV,
    resourceLimits: {
        maxOldGenerationSizeMb: 32_768
    },
})

let initVars = await getInitVars()

const goalNumber = new HugeInt(normalizedEnv.goal_number, normalizedEnv.base)
const log_interval = normalizedEnv.log_interval
const startSessionTime = Date.now()
const startTime = startSessionTime - initVars.up_time

postMessages( worker, 'init', {
    initVars: {
        ...initVars,
    },
    base:  normalizedEnv.base,
    goalNumber: goalNumber.value,
    startSessionTime,
    startTime,
})

while (process.env.isWorkerReady !== 'true') {
    await gaySchluffen(100)
}

await multiPerSearch(initVars, log_interval, startSessionTime, startTime, worker)
await worker.terminate()
console.log('---------- FINISH ----------')