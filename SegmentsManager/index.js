import { saveComputationState } from '#Config/computationStateIO.js'
import HugeIntEx from '#HugeIntEx/index.js'
import advanceBy from '#permutations/advanceBy.js'
import { positionOf } from '#permutations/positionOf.js'
import { importJsFile } from '#utils/fileUtils.js'
import {
    iterationsRateAt,
    mergeAdjacentDone,
    reconcileFullSegmentEntries,
    saveFullSegmentEntry,
    saveManagerState,
    stem,
    verifyAgainstDisk,
} from './utils.js'

/**
 * Fresh running state entry for segment id 1.
 *
 * @returns {StateSegmentEntry}
 */
const stateSegmentEntryFactory = () => ({
    endId: 1,
    startId: 1,
    status: 'running',
})

/**
 * Fresh running full entry for segment id 1.
 *
 * @param {FactoryParams} params
 * @returns {FullSegmentEntry}
 */
const fullSegmentEntryFactory = params => ({
    base: params.base,
    computationState: computationStateFactory(params),
    endAt: 0n,
    endId: 1,
    iterationsToExecute: 0n,
    previousEndAt: 0n,
    startId: 1,
    status: 'running',
})

/**
 * Fresh manager state with no segments.
 *
 * @param {FactoryParams} params
 * @returns {SegmentsManagerState}
 */
const segmentsManagerStateFactory = params => ({
    base: params.base,
    segmentEntries: [],
    status: 'running',
})

/**
 * Fresh computation state for a segment.
 *
 * @param {FactoryParams} params
 * @returns {ComputationState}
 */
const computationStateFactory = params => ({
    iterations: {
        actual: 0n,
        count: 0,
        found_nothing: 0,
        found_nothing_break_at: params.found_nothing_break_at,
    },
    last_number: process.normalizedEnv.last_number,
    number_lengths: {},
    pseudoGoal: params.pseudoGoal,
    range_start: 0n,
    steps: [],
    up_time: 0,
})

/**
 * Hands out segments of one base's search and takes their progress back; never searches itself.
 * Events: `ready`, `segmentUpdate`, `completed`, `suicideNote`.
 */
class SegmentsManager extends EventTarget {
    /**
     * Loads the base's state and segments; fires `ready`, or finishes the job when it is already complete.
     *
     * @param {SegmentsManagerParams} params
     * @param {SegmentsManagerOptions} [options]
     */
    constructor({ base, pseudoGoal }, options = {}) {
        super()
        this.#endRate = options.endRate ?? this.#endRate
        this.#factoryParams = {
            base,
            found_nothing_break_at: process.normalizedEnv.found_nothing_break_at,
            pseudoGoal,
        }
        this.#segmentAboutDuration = options.segmentAboutDuration ?? 600
        this.#startRate = options.startRate ?? this.#startRate
        this.#pseudoGoalNumberOfIterations = positionOf(new HugeIntEx(base, undefined, pseudoGoal))

        this.#loadStateAndVerify(base).then(state => {
            this.#state = state

            if (state.status === 'completed') {
                this.#commitSuicide()
                return
            }

            if (this.#isJobCompleted()) {
                const [fullSegmentEntry] = this.#fullSegmentEntries

                this.#state.status = 'completed'
                saveComputationState(this.#factoryParams.base, fullSegmentEntry.computationState).then(() => {
                    saveManagerState(this.#state, () => this.#commitSuicide())
                })
                return
            }

            this.#ready = true
            this.dispatchEvent(new CustomEvent('ready', { detail: true }))
        })
    }

    /** @type {number} assumed iterations/sec near `pseudoGoal` */
    #endRate = 1
    /** @type {FactoryParams} */
    #factoryParams
    /** @type {FullSegmentEntry[]} ordered by `startId` */
    #fullSegmentEntries = []
    /** @type {bigint} canonical numbers up to `pseudoGoal` */
    #pseudoGoalNumberOfIterations
    /** @type {boolean} */
    #ready = false
    /** @type {number} seconds a new segment should take */
    #segmentAboutDuration
    /** @type {StateSegmentEntry[]} entries handed out since startup */
    #segmentServed = []
    /** @type {number} assumed iterations/sec near 0 */
    #startRate = 750_000
    /** @type {SegmentsManagerState} */
    #state

    /**
     * Saved manager state (or a fresh one) and its segments loaded from disk into `#fullSegmentEntries`.
     *
     * @param {bigint} base
     * @returns {Promise<SegmentsManagerState>}
     */
    async #loadStateAndVerify(base) {
        let state

        try {
            state = await importJsFile(stem(base))
        } catch {
            state = segmentsManagerStateFactory(this.#factoryParams)
        }
        this.#fullSegmentEntries = await verifyAgainstDisk(this.#factoryParams.base, state.segmentEntries)
        this.#fullSegmentEntries.sort((a, b) => a.startId - b.startId)

        return state
    }

    /**
     * Clears everything, marks the state dead and fires `suicideNote`.
     *
     * @returns {void}
     */
    #commitSuicide() {
        this.#fullSegmentEntries = []
        this.#ready = false
        this.#segmentServed = []
        this.#state.segmentEntries = []
        this.#state.status = 'dead'

        this.dispatchEvent(new CustomEvent('suicideNote', { detail: 'dead' }))
    }

    /**
     * Whether one done entry covers everything and it hit the found-nothing limit.
     *
     * @returns {boolean}
     */
    #isJobCompleted() {
        if (this.#fullSegmentEntries.length !== 1) return false

        const [fullSegmentEntry] = this.#fullSegmentEntries
        const { found_nothing, found_nothing_break_at } = fullSegmentEntry.computationState.iterations

        return fullSegmentEntry.status === 'done' && found_nothing >= found_nothing_break_at
    }

    /**
     * Next segment to run: an unserved running one, else a new one, else a `'stall'` placeholder.
     *
     * @returns {FullSegmentEntry}
     */
    get Segment() {
        if (!this.#ready) throw new Error('SegmentsManager is not ready')

        const entry = this.#state.segmentEntries.find(
            stateSegmentEntry => stateSegmentEntry.status === 'running' &&
            !this.#segmentServed.includes(stateSegmentEntry),
        )

        if (entry) {
            const fullSegmentEntry = this.#fullSegmentEntries.find(
                segmentEntry => segmentEntry.startId === entry.startId,
            )

            if (!fullSegmentEntry) {
                // Something went wrong
                throw new Error(`Segment Entry ${JSON.stringify(entry)} not found in #fullSegmentEntries.`)
            }
            this.#segmentServed.push(entry)
            return structuredClone(fullSegmentEntry)
        }

        const lastFullSegmentEntry = this.#fullSegmentEntries[this.#fullSegmentEntries.length - 1]
        const lastStateSegmentEntry = this.#state.segmentEntries[this.#state.segmentEntries.length - 1]

        if (!lastStateSegmentEntry !== !lastFullSegmentEntry) {
            throw new Error('StateSegmentEntries and FullSegmentEntries are out of sync')
        }

        if (lastFullSegmentEntry &&
            lastFullSegmentEntry.endAt >= this.#factoryParams.pseudoGoal &&
            lastFullSegmentEntry.status !== 'done') {
            const stallEntry = fullSegmentEntryFactory(this.#factoryParams)
            stallEntry.status = 'stall'
            return stallEntry
        }

        const stateSegmentEntry = stateSegmentEntryFactory()
        const fullSegmentEntry = fullSegmentEntryFactory(this.#factoryParams)

        if (lastStateSegmentEntry && lastFullSegmentEntry) {
            // Should be the same
            if (lastStateSegmentEntry.startId !== lastFullSegmentEntry.startId ||
                lastStateSegmentEntry.endId !== lastFullSegmentEntry.endId ||
                lastStateSegmentEntry.status !== lastFullSegmentEntry.status) {
                throw new Error(`StateSegmentEntry ${JSON.stringify(lastStateSegmentEntry)} ` +
                    `is not equal to FullSegmentEntry ${JSON.stringify(lastFullSegmentEntry)}`)
            }
            stateSegmentEntry.startId = stateSegmentEntry.endId = lastStateSegmentEntry.endId + 1
            fullSegmentEntry.startId = fullSegmentEntry.endId = lastFullSegmentEntry.endId + 1

            fullSegmentEntry.previousEndAt = lastFullSegmentEntry.endAt
        }

        const startPosition = positionOf(
            new HugeIntEx(this.#factoryParams.base, undefined, fullSegmentEntry.previousEndAt),
        )
        const rateAtPosition = iterationsRateAt(
            this.#endRate,
            startPosition,
            this.#pseudoGoalNumberOfIterations,
            this.#startRate,
        )
        const iterationsToExecute = BigInt(Math.round(rateAtPosition * this.#segmentAboutDuration))

        fullSegmentEntry.computationState.last_number = fullSegmentEntry.previousEndAt
        fullSegmentEntry.endAt = advanceBy(
            this.#factoryParams.base,
            iterationsToExecute,
            fullSegmentEntry.previousEndAt,
        )
        fullSegmentEntry.iterationsToExecute = iterationsToExecute

        this.#state.segmentEntries.push(stateSegmentEntry)
        this.#fullSegmentEntries.push(fullSegmentEntry)
        this.#segmentServed.push(stateSegmentEntry)

        saveFullSegmentEntry(fullSegmentEntry)
        saveManagerState(this.#state)

        return structuredClone(fullSegmentEntry)
    }

    /**
     * Takes a served segment's progress: saves a running one; saves a done one, merges its done neighbours
     * and saves the state.
     *
     * @param {FullSegmentEntry} candidateFullSegmentEntry
     */
    set Segment(candidateFullSegmentEntry) {
        if (!this.#ready && candidateFullSegmentEntry.status === 'done') throw new Error('SegmentsManager is not ready')
        if (candidateFullSegmentEntry.status !== 'running' && candidateFullSegmentEntry.status !== 'done') return

        const stateSegmentEntry = this.#state.segmentEntries.find(
            stateSegmentElement => stateSegmentElement.status === 'running' &&
                stateSegmentElement.startId === candidateFullSegmentEntry.startId &&
                stateSegmentElement.endId === candidateFullSegmentEntry.endId &&
                this.#segmentServed.includes(stateSegmentEntry),
        )
        if (!stateSegmentEntry) return

        /**
         * Marks the manager ready and fires `ready`.
         *
         * @returns {void}
         */
        const unlock = () => {
            this.#ready = true
            this.dispatchEvent(new CustomEvent('ready', { detail: true }))
        }

        /**
         * Saves the entry and the manager state; finishes the job when it is complete.
         *
         * @param {FullSegmentEntry} fullSegmentEntry
         * @returns {void}
         */
        const saveFullSegmentEntryAndSegmentManagementState = fullSegmentEntry => {
            saveFullSegmentEntry(fullSegmentEntry, () => {
                this.dispatchEvent(new CustomEvent('segmentUpdate', { detail: fullSegmentEntry }))

                if (this.#isJobCompleted()) {
                    this.#state.status = 'completed'
                    saveComputationState(
                        this.#factoryParams.base,
                        fullSegmentEntry.computationState,
                    ).then(() => {
                        saveManagerState(this.#state, () => {
                            this.dispatchEvent(new CustomEvent('completed', { detail: fullSegmentEntry }))
                            this.#commitSuicide()
                        })
                    })
                    return
                }
                saveManagerState(this.#state, unlock)
            })
        }

        const currentFullSegmentEntry = this.#fullSegmentEntries.find(
            fullSegmentEntry => fullSegmentEntry.startId === stateSegmentEntry.startId,
        )

        const fullSegmentEntry = reconcileFullSegmentEntries(candidateFullSegmentEntry, currentFullSegmentEntry)

        if (fullSegmentEntry.status === 'broken') return

        if (fullSegmentEntry.status === 'running') {
            saveFullSegmentEntry(fullSegmentEntry, () => {
                this.dispatchEvent(new CustomEvent('segmentUpdate', { detail: fullSegmentEntry }))
            })
            return
        }

        this.#ready = false
        this.dispatchEvent(new CustomEvent('ready', { detail: false }))

        stateSegmentEntry.status = fullSegmentEntry.status

        saveFullSegmentEntry(fullSegmentEntry, () => {
            mergeAdjacentDone(this.#fullSegmentEntries, this.#state.segmentEntries, fullSegmentEntry)
            saveFullSegmentEntryAndSegmentManagementState(fullSegmentEntry)
        })
    }
}

export default SegmentsManager
