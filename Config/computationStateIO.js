// noinspection ES6UnusedImports

import { promises as fs } from 'fs'
// eslint-disable-next-line no-unused-vars
import HugeInt from '../HugeInt/index.js'
import {readJsonFile, writeJsonFile} from '../utils/fileUtils.js'
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
 *     In memory: histogram of step-1 product digit-lengths, `{ length: count }`.
 *     On disk: a sorted `[{ length, count }]` row array (see the replacer/reviver).
 *
 * @property {Object<string, number>} digitSets
 *     Histogram of the numbers' digit sets, `{ "2,5,7": count }` in memory,
 *     `[{ digits, count }]` sorted by count on disk.
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
 * @property {number} time
 *     Total time spent searching this length.
 *
 * @property {TypeStep} steps
 *     Step information for this length.
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

/**
 * JSON reviver used when loading saved state.
 *
 * Converts specific fields into BigInt values, and turns each `productLengths` /
 * `digitSets` row array (how histograms are stored on disk) back into the
 * `{ key: count }` map the recorder increments.
 *
 * @param {string} key
 * @param {*} value
 * @returns {BigInt|*}
 */
const reviver = (key, value) => {
    if (key === 'productLengths' && Array.isArray(value)) {
        const map = {}
        for (const row of value) map[row.length] = row.count
        return map
    }
    if (key === 'digitSets' && Array.isArray(value)) {
        const map = {}
        for (const row of value) map[row.digits] = row.count
        return map
    }

    switch (key) {
        case 'additionSum':
        case 'base':
        case 'calculated':
        case 'currentNoValue':
        case 'combinations':
        case 'iteration':
        case 'last_number':
        case 'multiplySum':
            return BigInt(value)
    }
    return value
}

/**
 * Load computation state variables from the results file.
 *
 * If `debug=true`, returns default values without reading from disk.
 * If the main JSON file is missing, attempts to load a `.bak` backup.
 *
 * @returns {Promise<ComputationState>}
 */
export const getComputationState = async () => {

    const { normalizedEnv } = process
    const { vars_file } = normalizedEnv
    const filename = `./results/${normalizedEnv.base.toString().padStart(5, '0')}_${vars_file}`

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
        up_time: 0,
        steps: [],
    }

    try {
        return await readJsonFile(filename, reviver, defaultVars)
    } catch {}

    return defaultVars
}

/**
 * JSON replacer used when saving state.
 *
 * Converts BigInt and HugeInt values into strings so they can be serialized.
 *
 * @param {string} key
 * @param {*} value
 * @returns {string|*}
 */
const replacer = (key, value) => {
    if (key === 'productLengths' && value && !Array.isArray(value)) {
        return Object.entries(value)
            .map(([length, count]) => ({ length: Number(length), count }))
            .sort((a, b) => a.length - b.length)
    }
    if (key === 'digitSets' && value && !Array.isArray(value)) {
        return Object.entries(value)
            .map(([digits, count]) => ({ digits, count }))
            .sort((a, b) => b.count - a.count || (a.digits < b.digits ? -1 : 1))
    }

    const name = value?.constructor?.name
    if (name === 'BigInt') {
        return value.toString()
    }
    if (name === 'HugeInt' || name === 'HugeIntEx') {
        return value.value.toString()
    }
    return value
}

/**
 * Puts each histogram row (`{ length, count }` or `{ digits, count }`) back on a
 * single line — the tab-indented printer otherwise spreads every row across
 * several lines.
 *
 * @param {string} json
 * @returns {string}
 */
const collapseHistograms = (json) => json
    .replace(/\{\s*"length":\s*(\d+),\s*"count":\s*(\d+)\s*}/g, '{ "length": $1, "count": $2 }')
    .replace(/\{\s*"digits":\s*("[^"]*"),\s*"count":\s*(\d+)\s*}/g, '{ "digits": $1, "count": $2 }')

/**
 * Save computation state variables to disk.
 *
 * Writes to:
 *   ./results/<base>_<vars_file>
 *
 * Before writing, attempts to rename the existing file to `.bak`.
 *
 * @param {ComputationState} computationState
 *     The initialization variables to save.
 *
 * @param {BigInt} base
 *     The numeric base used to determine the filename.
 *
 * @returns {Promise<void>}
 */
export const setComputationState = async (computationState, base) => {
    const { normalizedEnv } = process
    const { vars_file } = normalizedEnv

    if (normalizedEnv.debug) return

    const fileName = `./results/${base.toString().padStart(5, '0')}_${vars_file}`

    try {
        await writeJsonFile(fileName, computationState, replacer, '\t', undefined, collapseHistograms)
    }
    catch {}
}
