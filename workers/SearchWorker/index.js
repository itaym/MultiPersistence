/** Search worker entry: runs the search on `run` and feeds the persist worker. */
import { getComputationState } from '#Config/computationStateIO.js'
import HugeInt from '#HugeInt/index.js'
import { multiPerSearch } from '#MultiplicativePersistence/index.js'
import gaySchluffen from '#utils/gaySchluffen.js'
import { initPollyFill } from '#utils/pollyfill.js'
import postMessages from '#utils/postMessage.js'
import showLog from '#utils/showLog.js'
import waitForWorker from '#utils/waitForWorker.js'
import {
    parentPort,
    SHARE_ENV,
    Worker,
} from 'node:worker_threads'

initPollyFill()

/**
 * Starts the persist worker, loads the state and runs the search to the end.
 *
 * @param {NormalizedEnv} normalizedEnv
 * @returns {Promise<void>}
 */
const run = async normalizedEnv => {
    const { env } = process

    env.isWorkerReady = 'false'
    env.log = ''

    // noinspection JSCheckFunctionSignatures
    const worker = new Worker(new URL(import.meta.resolve('#PersistWorker/index.js')), {
        env: SHARE_ENV,
        resourceLimits: {
            maxOldGenerationSizeMb: 32_768,
        },
    })

    const computationState = await getComputationState()

    const { check_interval_count } = normalizedEnv
    const { checkpoint_interval } = normalizedEnv
    const pseudoGoalNumber = new HugeInt(normalizedEnv.base, undefined, normalizedEnv.pseudo_goal_number)
    const { log_interval } = normalizedEnv
    const startSessionTime = Date.now()
    const startTime = startSessionTime - computationState.up_time

    /** @type {WorkerConfig} */
    const workerConfig = {
        base: normalizedEnv.base,
        pseudoGoal: computationState.pseudoGoal,
        pseudoGoalNumber: pseudoGoalNumber.value,
        range_start: computationState.range_start,
        startSessionTime,
        startTime,
        VARS: {
            ...computationState,
        },
    }

    postMessages(workerConfig, 'init', worker)

    while (process.env.isWorkerReady !== 'true') {
        await waitForWorker(100)
    }

    /**
     * Yields to the event loop.
     *
     * @returns {Promise<number>}
     */
    const tick = () => gaySchluffen(0)

    // noinspection JSCheckFunctionSignatures
    await multiPerSearch(
        check_interval_count,
        checkpoint_interval,
        computationState,
        log_interval,
        startSessionTime,
        startTime,
        tick,
        worker,
    )
    await worker.terminate()
    showLog('---------- FINISH ----------')
}

/**
 * Stores the env from the main thread and reports ready.
 *
 * @param {SearchInitMessage} msg
 * @returns {void}
 */
const init = msg => {
    process.normalizedEnv = msg.normalizedEnv
    parentPort.postMessage({ type: 'ready' })
}

parentPort.on('message', msg => {
    if (msg?.type === 'init') init(msg)
    if (msg?.type === 'run') run(process.normalizedEnv).then()
    if (msg?.type === 'debugger') {
        // eslint-disable-next-line no-debugger
        debugger
    }
})
