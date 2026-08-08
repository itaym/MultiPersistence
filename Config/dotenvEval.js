import { argv } from 'node:process';
// noinspection ES6UnusedImports
import HugeInt from "../HugeInt/index.js";
/**
 * Normalized environment configuration produced by `dotenvEval`.
 *
 * @typedef {Object} NormalizedEnv
 * @property {BigInt} base
 *     Numeric base used for HugeInt operations.
 *
 * @property {BigInt} goal_power_of10
 *     Exponent used to compute `goal_number = base ** goal_power_of10`.
 *
 * @property {BigInt} goal_number
 *     The computed target number for the persistence search.
 *
 * @property {BigInt} last_number
 *     Optional last processed number (if provided in env).
 *
 * @property {number} log_interval
 *     Milliseconds between log prints.
 *
 * @property {number} memorize_save_bach
 *     Batch size for memoization persistence.
 *
 * @property {string} vars_file
 *     Path to the `.env` file used.
 *
 * @property {boolean} debug
 *     Whether debug mode is enabled.
 */

/**
 * Evaluate and normalize environment variables from a parsed `.env` file.
 *
 * This function:
 *   1. Reads key/value pairs from `parsed`
 *   2. Attempts to `eval()` each value (trusted input only)
 *   3. Falls back to raw string if evaluation fails
 *   4. Stores normalized values in `process.normalizedEnv`
 *   5. Computes `goal_number = base ** goal_power_of10`
 *   6. Applies command‑line overrides for:
 *        - `base=...`
 *        - `debug=true|false`
 *
 * **Security note:**
 * The `eval()` call is safe here because the `.env` file is trusted and not
 * user‑controlled. This module must never be used on untrusted input.
 *
 * @param {{ parsed: Object<string,string> }} parsed
 *     The object produced by `dotenv` containing raw environment variables.
 */
const dotenvEval = ({ parsed }) => {
    let env = process.env
    let normalizedEnv = process.normalizedEnv || {}
    process.normalizedEnv = normalizedEnv

    for (let [key, value] of Object.entries(parsed)) {
        try {
            normalizedEnv[key.toLowerCase()] = eval(value + '')
        }
        catch {
            normalizedEnv[key.toLowerCase()] = value
        }
    }

    normalizedEnv.goal_number =
        BigInt(normalizedEnv.base) ** BigInt(normalizedEnv['goal_power_of10'])

    argv.forEach((val) => {
        const argArr = val.split('=')

        if (argArr[0] === 'base') {
            const base = BigInt(argArr[1])
            try {
                if (base > 1n || base < 65537n) {
                    normalizedEnv.base = base
                    env.base = base + ''
                }
            }
            catch {}
        }

        if (argArr[0] === 'debug') {
            const debug = argArr[1] === 'true'
            try {
                if (debug !== undefined) {
                    normalizedEnv.debug = debug
                    env.debug = !!debug + ''
                }
            }
            catch {}
        }
    })
}

export default dotenvEval
