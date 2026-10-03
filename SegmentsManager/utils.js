import toJs from '#io/utils.js'
import mergeSegments from '#runningSegments/mergeSegments.js'
import {
    importJsFile,
    writeTextFile,
} from '#utils/fileUtils.js'

/**
 * Merges the adjacent `absorbed` entry into `target`, in place.
 *
 * @param {FullSegmentEntry} absorbed
 * @param {FullSegmentEntry} target
 * @returns {void}
 */
const absorbFullSegmentEntry = (absorbed, target) => {
    const [lower, higher] = absorbed.startId < target.startId ? [absorbed, target] : [target, absorbed]
    const computationState = mergeSegments(higher.computationState, lower.computationState)
    const iterationsToExecute = lower.iterationsToExecute + higher.iterationsToExecute

    target.computationState = computationState
    target.endAt = higher.endAt
    target.endId = higher.endId
    target.iterationsToExecute = iterationsToExecute
    target.previousEndAt = lower.previousEndAt
    target.startId = lower.startId
}

/**
 * Assumed iterations/sec at `position`, linear from `startRate` to `endRate`, at least `endRate`.
 *
 * @param {number} endRate
 * @param {bigint} position
 * @param {bigint} pseudoGoalNumberOfIterations
 * @param {number} startRate
 * @returns {number}
 */
export const iterationsRateAt = (endRate, position, pseudoGoalNumberOfIterations, startRate) => {
    const fraction = BigInt(position) / pseudoGoalNumberOfIterations
    const rate = BigInt(startRate) - BigInt(startRate - endRate) * fraction

    return rate < 1n ? Math.round(endRate) : Number(rate)
}

/**
 * Full entry saved for a state entry.
 *
 * @param {bigint} base
 * @param {StateSegmentEntry} stateSegmentEntry
 * @returns {Promise<FullSegmentEntry>}
 */
export const loadSegment = async (base, stateSegmentEntry) => {
    const fileName = `${segmentStem({ base, ...stateSegmentEntry })}`
    return await importJsFile(fileName)
}

/**
 * Merges `fullSegmentEntry`, in place, with its previous and next entries when those are `'done'`, removing them
 * from both arrays.
 *
 * @param {FullSegmentEntry[]} arrayFullSegmentEntries
 * @param {StateSegmentEntry[]} arraySegmentEntries
 * @param {FullSegmentEntry} fullSegmentEntry
 * @returns {void}
 */
export const mergeAdjacentDone = (arrayFullSegmentEntries, arraySegmentEntries, fullSegmentEntry) => {
    const stateSegmentEntry = arraySegmentEntries.find(
        stateSegmentElement => stateSegmentElement.startId === fullSegmentEntry.startId,
    )

    const previousFullSegmentEntry = arrayFullSegmentEntries.find(entry => entry.endId === fullSegmentEntry.startId - 1)

    if (previousFullSegmentEntry?.status === 'done') {
        const previousStateIndex = arraySegmentEntries.findIndex(
            stateSegmentElement => stateSegmentElement.startId === previousFullSegmentEntry.startId,
        )

        absorbFullSegmentEntry(previousFullSegmentEntry, fullSegmentEntry)
        arrayFullSegmentEntries.splice(arrayFullSegmentEntries.indexOf(previousFullSegmentEntry), 1)
        arraySegmentEntries.splice(previousStateIndex, 1)
    }

    const nextFullSegmentEntry = arrayFullSegmentEntries.find(entry => entry.startId === fullSegmentEntry.endId + 1)

    if (nextFullSegmentEntry?.status === 'done') {
        const nextStateIndex = arraySegmentEntries.findIndex(
            stateSegmentElement => stateSegmentElement.startId === nextFullSegmentEntry.startId,
        )

        absorbFullSegmentEntry(nextFullSegmentEntry, fullSegmentEntry)
        arrayFullSegmentEntries.splice(arrayFullSegmentEntries.indexOf(nextFullSegmentEntry), 1)
        arraySegmentEntries.splice(nextStateIndex, 1)
    }

    stateSegmentEntry.endId = fullSegmentEntry.endId
    stateSegmentEntry.startId = fullSegmentEntry.startId
}

/**
 * Reconciles the stored `current` entry with a reported `candidate`: the `'done'` one, or else the one further
 * along, wins, copied into `current`.
 *
 * @param {FullSegmentEntry} candidate
 * @param {FullSegmentEntry} current updated in place
 * @returns {FullSegmentEntry} `current`, or a new `'broken'` entry when they don't match
 */
export const reconcileFullSegmentEntries = (candidate, current) => {
    const isSameSegment =
        current.base === candidate.base &&
        current.endAt === candidate.endAt &&
        current.endId === candidate.endId &&
        current.iterationsToExecute === candidate.iterationsToExecute &&
        current.previousEndAt === candidate.previousEndAt &&
        current.startId === candidate.startId

    if (!isSameSegment) return (/** @type {FullSegmentEntry} */ { status: 'broken' })
    if (current.status === 'done') return current

    if (candidate.status === 'done') {
        current.computationState = candidate.computationState
        current.status = 'done'
        return current
    }

    const { iterations, last_number } = candidate.computationState

    if (iterations.actual <= current.computationState.iterations.actual) return current

    const isInRange =
        iterations.actual <= current.iterationsToExecute &&
        last_number >= current.previousEndAt &&
        last_number <= current.endAt

    if (!isInRange) return (/** @type {FullSegmentEntry} */ { status: 'broken' })

    current.computationState = candidate.computationState
    return current
}

/**
 * Writes the entry to its segment file, then calls `callback`.
 *
 * @param {FullSegmentEntry} fullSegment
 * @param {() => void} [callback]
 * @returns {void}
 */
export const saveFullSegmentEntry = (fullSegment, callback = () => {}) => {
    const fileName = `${segmentStem(fullSegment)}.js`
    const content = `export default ${toJs(fullSegment)}\n`
    writeTextFile(fileName, content).then(callback)
}

/**
 * Writes the manager state file, then calls `callback`.
 *
 * @param {SegmentsManagerState} state
 * @param {() => void} [callback]
 * @returns {void}
 */
export const saveManagerState = (state, callback = () => {}) => {
    const fileName = `${stem(state.base)}.js`
    const content = `export default ${toJs(state)}\n`
    writeTextFile(fileName, content).then(callback)
}

/**
 * `./results/<base>-<startId>-<endId>-segment`; append `.js` / `.js.bak`.
 *
 * @param {SegmentIds} entry
 * @returns {string}
 */
export const segmentStem = ({ base, endId, startId }) =>
    `./results/${Number(base).toString().padStart(5, '0')}-` +
    `${String(startId).padStart(5, '0')}-${String(endId).padStart(5, '0')}-segment`

/**
 * `./results/<base>-segments-manager`; append `.js` / `.js.bak`.
 *
 * @param {bigint} base
 * @returns {string}
 */
export const stem = base => `./results/${Number(base).toString().padStart(5, '0')}-segments-manager`

/**
 * Full entries of every state entry, loaded from disk.
 *
 * @param {bigint} base
 * @param {StateSegmentEntry[]} stateSegmentEntries
 * @returns {Promise<FullSegmentEntry[]>}
 */
export const verifyAgainstDisk = async (base, stateSegmentEntries) => {
    const fullSegmentEntries = []

    for (const stateSegmentEntry of stateSegmentEntries) {
        fullSegmentEntries.push(await loadSegment(base, { ...stateSegmentEntry }))
    }
    return fullSegmentEntries
}
