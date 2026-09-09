// noinspection ES6UnusedImports

import { promises as fs } from 'fs'
// eslint-disable-next-line no-unused-vars
import HugeInt from '../HugeInt/index.js'
import { writeTextFile } from '../utils/fileUtils.js'
import { toJs } from '../io/utils.js'
import { pathToFileURL } from 'url'
import { resolve } from 'path'
/**
 * Iteration statistics stored in the results file.
 *
 * @typedef {object} Iterations
 * @property {BigInt} calculated
 *     Total number of calculated iterations.
 *
 * @property {number} count
 *     Total number of real iterations performed.
 *
 * @property {number} found_nothing
 *     Number of consecutive iterations that found no results.
 *
 * @property {number} found_nothing_break_at
 *     Threshold at which the search should stop due to no findings.
 */

/**
 * A single persistence step entry.
 *
 * @typedef {object} TypeStep
 * @property {Object<string, number>} additionSums
 *     Histogram of digit-addition sums, `{ additionSum: count }`.
 *
 * @property {number} [atRunTime]
 *     Milliseconds elapsed when this step was recorded.
 *
 * @property {BigInt} combinations
 *     Number of combinations evaluated at this step.
 *
 * @property {number} count
 *     Number of results found at this step.
 *
 * @property {BigInt} first
 *     First number found at this step.
 *
 * @property {number} [iteration]
 *     Iteration index when this step was recorded.
 *
 * @property {BigInt} last
 *     Last number found at this step.
 *
 * @property {Object<string, number>} productLengths
 *     Histogram of step-1 product digit-lengths, `{ length: count }`.
 *
 * @property {number} [step]
 *     Persistence step index.
 */

/**
 * Properties stored per number length.
 *
 * @typedef {object} LengthProps
 * @property {number} found
 *     How many results were found for this length.
 *
 * @property {TypeStep} steps
 *     Step information for this length.
 *
 * @property {number} time
 *     Total time spent searching this length.
 */

/**
 * Mapping of number lengths to their statistics.
 *
 * @typedef {Object<string, LengthProps>} NumberLengths
 */

/**
 * Structure of the initialization variables loaded from disk.
 *
 * @typedef {object} ComputationState
 * @property {BigInt} base
 *     The numeric base used for HugeInt operations.
 *
 * @property {Iterations} iterations
 *     Iteration statistics.
 *
 * @property {BigInt} last_number
 *     The last number processed before saving.
 *
 * @property {NumberLengths} number_lengths
 *     Statistics grouped by number length.
 *
 * @property {TypeStep[]} steps
 *     Array of persistence step entries.
 */

/** `./results/<base 5-char>_<results_file>` — the caller appends `.js` / `.js.bak`. */
const resultsStem = (base) =>
    `./results/${base.toString().padStart(5, '0')}_${process.normalizedEnv.results_file}`

/**
 * Load computation state from `<resultsStem>.js` (an ESM module — a BigInt round
 * trips as a `123n` literal, no reviver needed).
 *
 * Returns default values in debug mode, or when the file can't be imported —
 * trying the `.js.bak` backup first.
 *
 * @returns {Promise<ComputationState>}
 */
export const getComputationState = async () => {

    const { normalizedEnv } = process

    /** @type ComputationState */
    const defaultVars = {
        base: normalizedEnv.base,
        iterations: {
            calculated: 0n,
            count: 0,
            found_nothing: 0,
            found_nothing_break_at: 1_000_000_000,
        },
        last_number: normalizedEnv.last_number,
        number_lengths: {},
        steps: [],
        up_time: 0,
    }

    if (normalizedEnv.debug) return defaultVars

    const stem = resolve(resultsStem(normalizedEnv.base))

    try {
        return (await import(pathToFileURL(`${stem}.js`).href)).default
    } catch {}

    try {
        // main file missing or corrupt — import the backup as an inline module
        const src = await fs.readFile(`${stem}.js.bak`, 'utf8')
        return (await import(`data:text/javascript,${encodeURIComponent(src)}`)).default
    } catch {}

    return defaultVars
}

/**
 * Save computation state to `<resultsStem>.js`, an `export default { ... }`
 * module. The existing file is renamed to `.js.bak` first.
 *
 * @param {ComputationState} computationState  the state to save
 * @param {BigInt} base                        base, picks the filename
 * @returns {Promise<void>}
 */
export const setComputationState = async (computationState, base) => {
    try {
        await writeTextFile(`${resultsStem(base)}.js`, `export default ${toJs(computationState)}\n`)
    }
    catch {}
}
