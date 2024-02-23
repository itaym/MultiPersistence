/** config must be the first import. It initializes the environment variables */
import './Config/config.js'
/** ------------------------------------------------------------------------- */
import HugeInt from './HugeInt/index.js'
import { Worker, SHARE_ENV } from 'worker_threads'
import { getInitVars } from './Config/getInitVars.js'
import { multiplicativePersistenceSearch } from './MultiplicativePersistence/index.js'
import postMessage from './utils/postMessage.js'

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

let goalNumber = new HugeInt(selfEnv.goal_number, selfEnv.base)
postMessage( worker, 'init', {
    VARS: {
        ...initVars,
    },
    base:  selfEnv.base,
    goalNumber: goalNumber.value,
})

// noinspection JSCheckFunctionSignatures
await multiplicativePersistenceSearch(initVars, worker)
worker.terminate()