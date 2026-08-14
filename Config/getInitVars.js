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
 * @typedef {object} InitVars
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
 * Converts specific fields into BigInt values.
 *
 * @param {string} key
 * @param {*} value
 * @returns {BigInt|*}
 */
const reviver = (key, value) => {
    switch (key) {
        case 'base':
        case 'calculated':
        case 'combinations':
        case 'first':
        case 'iteration':
        case 'last':
        case 'last_number':
            return BigInt(value)
    }
    return value
}

/**
 * Load initialization variables from the results file.
 *
 * If `debug=true`, returns default values without reading from disk.
 * If the main JSON file is missing, attempts to load a `.bak` backup.
 *
 * @returns {Promise<InitVars>}
 */
export const getInitVars = async () => {

    const { normalizedEnv } = process
    const { vars_file } = normalizedEnv
    const filename = `./results/${normalizedEnv.base.toString().padStart(5, '0')}_${vars_file}`

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

    if (normalizedEnv.debug) return defaultVars

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
    const name = value?.constructor?.name
    if (name === 'BigInt') {
        return value.toString()
    }
    if (name === 'HugeInt') {
        return value.value.toString()
    }
    return value
}

/**
 * Save initialization variables to disk.
 *
 * Writes to:
 *   ./results/<base>_<vars_file>
 *
 * Before writing, attempts to rename the existing file to `.bak`.
 *
 * @param {InitVars} initVars
 *     The initialization variables to save.
 *
 * @param {BigInt} base
 *     The numeric base used to determine the filename.
 *
 * @returns {Promise<void>}
 */
export const setInitVars = async (initVars, base) => {
    const { normalizedEnv } = process
    const { vars_file } = normalizedEnv

    const fileName = `./results/${base.toString().padStart(5, '0')}_${vars_file}`

    try {
        await writeJsonFile(fileName, initVars, replacer, '\t')
    }
    catch {}
}
