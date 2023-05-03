/** config must be the first import. It initializes the environment variables */
import './Config/config.js'
/** ------------------------------------------------------------------------- */
import HugeInt from './HugeInt/index.js'
import { Worker, SHARE_ENV } from 'worker_threads'
import { getInitVars } from './Config/getInitVars.js'
import multiplicativePersistenceSearch from './MultiplicativePersistence/multiplicativePersistenceSearch.js'
import postMessage from './utils/postMessage.js'

process.env.isWorkerReady = 'false'
process.env.log = ''

// noinspection JSCheckFunctionSignatures
const worker = new Worker('./worker.js', {
    'env': SHARE_ENV,
    resourceLimits: {
        maxOldGenerationSizeMb: 16_384
    },
})

const INIT_VARS = !process.selfEnv.DEBUG ? await getInitVars(process.selfEnv.INIT_BASE) : {}
if (!INIT_VARS[process.selfEnv.INIT_BASE]) {
    INIT_VARS[process.selfEnv.INIT_BASE] = {
        BASE: process.selfEnv.INIT_BASE,
        COUNT_ITERATIONS: 0,
        CALC_ITERATIONS: 0,
        ITERATIONS_NOT_FOUND: 0,
        ITERATIONS_NOT_FOUND_LIMIT: 1_00_000_000,
        LAST_FOUND: 0n,
        LENGTHS: {},
        MAX_STEPS: -1,
        NUMBER: process.selfEnv.INIT_NUMBER,
        UP_TIME_MILLISECONDS: process.selfEnv.INIT_UP_TIME_MILLISECONDS,
        STEPS: []
    }
}

let goalNumber = new HugeInt(process.selfEnv.INIT_GOAL_NUMBER, process.selfEnv.INIT_BASE)
postMessage( worker, 'init', {
    INIT_VARS: {
        ...INIT_VARS,
        [process.env.INIT_BASE]: {...INIT_VARS[process.env.INIT_BASE], LAST_FOUND: undefined},
    },
    base:  process.selfEnv.INIT_BASE,
    goalNumber: goalNumber.value,
})

// noinspection JSCheckFunctionSignatures
await multiplicativePersistenceSearch({ ...INIT_VARS[process.selfEnv.INIT_BASE], worker })
worker.terminate()