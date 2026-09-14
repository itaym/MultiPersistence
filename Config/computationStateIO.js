// noinspection ES6UnusedImports

// eslint-disable-next-line no-unused-vars
import HugeInt from '#HugeInt/index.js'
import { importJsFile, writeTextFile } from '#utils/fileUtils.js'
import { toJs } from '#io/utils.js'
/**
 * Iteration statistics stored in the results file.
 *
 * @typedef {object} Iterations
 * @property {BigInt} calculated total calculated iterations
 * @property {BigInt} count total real iterations performed
 * @property {number} found_nothing consecutive iterations that found nothing
 * @property {number} found_nothing_break_at miss count at which the search stops
 */

/**
 * A single persistence step entry.
 *
 * @typedef {object} TypeStep
 * @property {Object<string, number>} additionSums histogram of digit-addition sums, `{ additionSum: count }`
 * @property {number} [atRunTime] milliseconds elapsed when this step was recorded
 * @property {BigInt} combinations combinations evaluated at this step
 * @property {number} count results found at this step
 * @property {BigInt} first first number found at this step
 * @property {number} [iteration] iteration index when this step was recorded
 * @property {BigInt} last last number found at this step
 * @property {Object<string, number>} productLengths histogram of step-1 product digit-lengths, `{ length: count }`
 * @property {number} [step] persistence step index
 */

/**
 * Properties stored per number length.
 *
 * @typedef {object} LengthProps
 * @property {number} found results found for this length
 * @property {TypeStep} steps step information for this length
 * @property {number} time total time spent searching this length
 */

/**
 * Mapping of number lengths to their statistics.
 *
 * @typedef {Object<string, LengthProps>} NumberLengths
 */

/**
 * Identity and boundaries of the segment a result file belongs to.
 *
 * @typedef {object} SegmentMeta
 * @property {BigInt} base numeric base used for HugeInt operations
 * @property {number} createdAt timestamp (ms) when this segment was created
 * @property {BigInt} endAt inclusive upper bound of this segment
 * @property {number} endId highest original segment id merged into this result (own id if unmerged)
 * @property {string} id unique id for this segment
 * @property {BigInt} previousEndAt the previous segment's `endAt` (`0n` for the first segment) —
 *   not itself tested; the first number this segment tests is `addOneToSorted(previousEndAt)`
 * @property {number} startId lowest original segment id merged into this result (own id if unmerged)
 * @property {'running'|'done'} status whether this segment is still being processed or finished
 * @property {BigInt} [targetIterations] real iterations this segment should run for, set by a segments manager
 */

/**
 * Structure of the state loaded from disk.
 *
 * @typedef {object} ComputationState
 * @property {BigInt} goal exclusive upper bound — the first candidate not to check
 * @property {Iterations} iterations iteration statistics
 * @property {BigInt} last_number last number processed before saving (the moving resume point)
 * @property {SegmentMeta} meta identity and boundaries of this segment
 * @property {NumberLengths} number_lengths statistics grouped by number length
 * @property {BigInt} range_start inclusive lower bound of this run's range (fixed; `0n` in continuous mode)
 * @property {TypeStep[]} steps persistence step entries
 */

/** `./results/<base 5-char>_<results_file>` — the caller appends `.js` / `.js.bak`. */
const resultsStem = (base) =>
    `./results/${base.toString().padStart(5, '0')}_${process.normalizedEnv.results_file}`

/**
 * Loads the computation state. Returns defaults in debug mode or when neither `<stem>.js`
 * nor its `.js.bak` can be imported.
 *
 * @returns {Promise<ComputationState>}
 */
export const getComputationState = async () => {

    const { normalizedEnv } = process

    /** @type ComputationState */
    const defaultVars = {
        goal: normalizedEnv.goal_number,
        iterations: {
            calculated: 0n,
            count: 0,
            found_nothing: 0,
            found_nothing_break_at: 1_000_000_000,
        },
        last_number: normalizedEnv.last_number,
        meta: {
            base: normalizedEnv.base,
            createdAt: Date.now(),
            endAt: normalizedEnv.goal_number,
            endId: 1,
            id: crypto.randomUUID(),
            previousEndAt: 0n,
            startId: 1,
            status: 'running',
        },
        number_lengths: {},
        range_start: 0n,
        steps: [],
        up_time: 0,
    }

    if (normalizedEnv.debug) return defaultVars

    const backfill = (state) => {
        state.goal ??= normalizedEnv.goal_number
        state.meta ??= {
            base: normalizedEnv.base,
            createdAt: Date.now(),
            endAt: normalizedEnv.goal_number,
            endId: 1,
            id: crypto.randomUUID(),
            previousEndAt: 0n,
            startId: 1,
            status: 'running',
        }
        state.range_start ??= 0n
        return state
    }

    const loaded = await importJsFile(resultsStem(normalizedEnv.base))
    return loaded ? backfill(loaded) : defaultVars
}

/**
 * Saves the computation state to `<stem>.js` as an `export default {…}` module, renaming
 * any existing file to `.js.bak`.
 *
 * @param {ComputationState} computationState
 * @param {BigInt} base picks the filename
 * @returns {Promise<void>}
 */
export const setComputationState = async (computationState, base) => {
    try {
        await writeTextFile(`${resultsStem(base)}.js`, `export default ${toJs(computationState)}\n`)
    }
    catch {}
}
