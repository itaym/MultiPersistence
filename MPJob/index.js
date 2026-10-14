import {
    SHARE_ENV,
    Worker,
} from 'node:worker_threads'
import SegmentsManager from '#SegmentsManager/index.js'
import gaySchluffen from '#utils/gaySchluffen.js'
import repeat from '#utils/repeat.js'
import runAgnosticPromise from '#utils/runAgnosticPromise.js'

/**
 * An {@link MPJob}'s lifecycle stage; `''` until initialized.
 *
 * @typedef {''|'initialized'} MpJobStatus
 */

/**
 * A message from a search worker.
 *
 * @typedef {Object} Message
 * @property {number} id
 * @property {Object} payload
 * @property {'bored'|'done'} type
 */

// noinspection JSCheckFunctionSignatures
/**
 * Starts a search worker sharing the main thread's env.
 *
 * @param {NormalizedEnv} normalizedEnv
 * @returns {module:worker_threads.Worker}
 */
const newWorker = normalizedEnv =>
    new Worker(new URL(import.meta.resolve('#SearchWorker/index.js')), {
        env: SHARE_ENV,
        workerData: { normalizedEnv },
    })

/**
 * Next segment to run, once the manager is ready.
 *
 * @param {SegmentsManager} segmentsManager
 * @returns {Promise<FullSegmentEntry>}
 */
const getSegment = async segmentsManager => {
    await waitSegmentsManagerReady(segmentsManager)
    return segmentsManager.segment
}
/**
 * Hands a segment's progress to the manager, once it is ready.
 *
 * @param {SegmentsManager} segmentsManager
 * @param {FullSegmentEntry} fullSegmentEntry
 * @returns {Promise<void>}
 */
const setSegment = async (segmentsManager, fullSegmentEntry) => {
    await waitSegmentsManagerReady(segmentsManager)
    segmentsManager.segment = fullSegmentEntry
}
/**
 * Polls until the manager is no longer `'unprepared'`; throws after about a second.
 *
 * @param {SegmentsManager} segmentsManager
 * @returns {Promise<boolean>} always `true`
 */
const waitSegmentsManagerReady = async segmentsManager => {
    let count = 0
    while (segmentsManager.status === 'unprepared') {
        if (count > 10) {
            throw new Error('SegmentsManager failed to be ready.')
        }
        count++
        await gaySchluffen(100)
    }
    return true
}
/** Runs one base's search: a pool of search workers fed with segments by a {@link SegmentsManager}. */
class MPJob {
    /**
     * Starts the workers and the segments manager.
     *
     * @param {NormalizedEnv} normalizedEnv
     * @param {number} numberOfWorkers
     */
    constructor(normalizedEnv, numberOfWorkers) {
        this.#normalizedEnv = normalizedEnv
        this.#numberOfWorkers = numberOfWorkers
        this.#initializer()
    }

    /**
     * Adds the workers, creates the segments manager and marks the job initialized.
     *
     * @returns {void}
     */
    #initializer = () => {
        const { base, pseudo_goal_number: pseudoGoal } = this.#normalizedEnv

        this.#segmentManager = new SegmentsManager({ base, pseudoGoal })
        this.#segmentManager.addEventListener('suicideNote', this.#segmentManagerOnSuicideNote)

        repeat(() => this.#addWorker()).for(this.#numberOfWorkers).times()

        this.#status = 'initialized'
    }

    /** @type {NormalizedEnv} */
    #normalizedEnv
    /** @type {number} */
    #numberOfWorkers
    /** @type {SegmentsManager} */
    #segmentManager

    /**
     * On the manager's `suicideNote`: stops listening and removes every worker.
     *
     * @returns {void}
     */
    #segmentManagerOnSuicideNote = () => {
        this.#segmentManager.removeEventListener('suicideNote', this.#segmentManagerOnSuicideNote)

        for (const threadId of this.#workers.keys()) {
            this.#removeWorker(threadId)
        }
    }

    /** @type {MpJobStatus} */
    #status = ''
    /** @type {Map<number, module:worker_threads.Worker>} thread id → worker */
    #workers = new Map()

    /**
     * Starts a worker and wires its events, unless the job is completed or dead.
     *
     * @returns {void}
     */
    #addWorker() {
        if (['completed', 'dead'].includes(this.#segmentManager.status)) return
        const worker = newWorker(this.#normalizedEnv)
        worker.addListener('error', error => this.#workersOnError(error, worker.threadId))
        worker.addListener('message', message => this.#workersOnMessage(message, worker.threadId))
        worker.addListener('messageerror', message => this.#workersOnMessageError(message, worker.threadId))
        worker.addListener('exit', exitCode => this.#workersOnExit(exitCode, worker.threadId))
        this.#workers.set(worker.threadId, worker)
    }

    /**
     * Drops a worker, removes its listeners and terminates it.
     *
     * @param {number} threadId
     * @returns {void}
     */
    #removeWorker(threadId) {
        const worker = this.#workers.get(threadId)
        this.#workers.delete(threadId)
        if (!worker) return

        const eventNames = worker.eventNames()

        for (const eventName of eventNames) {
            worker.removeAllListeners(eventName)
        }
        worker.terminate()
            .then(exitCode => {
                // eslint-disable-next-line no-console
                console.log(`Worker Thread Id: ${threadId}, Exit Code: ${exitCode}`)
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.log(`Worker Thread Id: ${threadId}, Error: ${error}`)
            })
    }

    /**
     * Replaces a worker with a fresh one.
     *
     * @param {number} threadId
     * @returns {void}
     */
    #removeAndRestartWorker(threadId) {
        this.#removeWorker(threadId)
        this.#addWorker()
    }

    /**
     * On a worker's `error`: logs it and replaces the worker.
     *
     * @param {*} error
     * @param {number} threadId
     * @returns {void}
     */
    #workersOnError(error, threadId) {
        // eslint-disable-next-line no-console
        console.error(error)

        this.#removeAndRestartWorker(threadId)
    }

    /**
     * On a worker's `exit`: replaces the worker.
     *
     * @param {number} exitCode
     * @param {number} threadId
     * @returns {void}
     */
    #workersOnExit(exitCode, threadId) {
        this.#removeAndRestartWorker(threadId)
    }

    /**
     * On a worker's `message`: `bored` gets a new segment, `done` hands the segment back to the manager.
     *
     * @param {Message} message
     * @param {number} threadId
     * @returns {void}
     */
    #workersOnMessage(message, threadId) {
        const { payload, type } = message

        switch (type) {
            case 'bored':
                runAgnosticPromise(this.#workerSegmentSend(threadId))
                break
            case 'done':
                this.#workerSegmentDone(payload.segment)
                break
            default:
                // eslint-disable-next-line no-console
                console.error(`Message type "${type}" is invalid`)
                this.#removeWorker(threadId)
                this.#addWorker()
        }
    }

    /**
     * On a worker's `messageerror`: logs it and replaces the worker.
     *
     * @param {Error} event
     * @param {number} threadId
     * @returns {void}
     */
    #workersOnMessageError(event, threadId) {
        // eslint-disable-next-line no-console
        console.error(`What? Why? When? How?: ${event},${threadId}`)

        this.#removeAndRestartWorker(threadId)
    }

    /**
     * Sends the next segment to a worker as a `chore`.
     *
     * @param {number} threadId
     * @returns {Promise<void>}
     */
    async #workerSegmentSend(threadId) {
        /** @type {FullSegmentEntry} */
        const segment = await getSegment(this.#segmentManager)
        const message = {
            payload: {
                segment,
            },
            threadId,
            type: 'chore',
        }
        const worker = this.#workers.get(threadId)
        worker.postMessage(message)
    }

    /**
     * Hands a worker's a finished segment to the manager, un-awaited.
     *
     * @param {FullSegmentEntry} fullSegmentEntry
     * @returns {void}
     */
    #workerSegmentDone(fullSegmentEntry) {
        runAgnosticPromise(setSegment(this.#segmentManager, fullSegmentEntry))
    }

    /**
     * The job's lifecycle stage.
     *
     * @returns {MpJobStatus}
     */
    get status() {
        return this.#status
    }
}

export default MPJob
