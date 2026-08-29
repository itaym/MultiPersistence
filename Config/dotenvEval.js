import { argv } from 'node:process'
// noinspection ES6UnusedImports
import HugeInt from '../HugeInt/index.js'

/**
 * Converts a CLI argument string into a JavaScript value.
 *
 * Supports booleans, null, undefined, BigInt, and raw strings.
 *
 * @param {string} rawValue
 *     The raw CLI argument value.
 *
 * @returns {boolean|bigint|null|undefined|string}
 *     The coerced value.
 */
const coerceCliValue = (rawValue) => {
    const lower = rawValue.toLowerCase()

    if (lower === 'true') return true
    if (lower === 'false') return false
    if (lower === 'null') return null
    if (lower === 'undefined') return undefined

    try {
        return BigInt(rawValue)
    } catch {
        return rawValue
    }
}

/**
 * Normalizes environment variables parsed from dotenv.
 *
 * Converts values using eval (trusted input only) and stores results
 * in `process.normalizedEnv`. Computes `goal_number` from base settings.
 *
 * @param {Object<string,string>} parsed
 *     Raw environment variables from dotenv.
 *
 * @returns {void}
 */
const normalizeEnvFromDotenv = (parsed) => {
    const normalizedEnv = process.normalizedEnv || {}
    process.normalizedEnv = normalizedEnv

    for (const [key, value] of Object.entries(parsed)) {
        try {
            normalizedEnv[key.toLowerCase()] = eval(value + '')
        } catch {
            normalizedEnv[key.toLowerCase()] = value
        }
    }

    normalizedEnv.goal_number =
        BigInt(normalizedEnv.base) ** BigInt(normalizedEnv.goal_power_of10)
}

/**
 * Applies CLI overrides to normalized environment variables.
 *
 * Accepts arguments in the form `key=value`, coerces values safely,
 * updates both normalizedEnv and process.env, and recomputes goal_number
 * when relevant settings change.
 *
 * @param {string[]} argv
 *     CLI arguments.
 *
 * @returns {void}
 */
const applyCliOverrides = (argv) => {
    const normalizedEnv = process.normalizedEnv || {}
    const env = process.env

    for (const arg of argv) {
        const [key, rawValue] = arg.split('=')
        if (!key || rawValue === undefined) continue

        const lowerKey = key.toLowerCase()
        const value = coerceCliValue(rawValue)

        normalizedEnv[lowerKey] = value
        env[lowerKey] = value + ''
    }

    if ('base' in normalizedEnv && 'goal_power_of10' in normalizedEnv) {
        normalizedEnv.goal_number =
            BigInt(normalizedEnv.base) ** BigInt(normalizedEnv.goal_power_of10)
    }
}

/**
 * Initializes environment variables by normalizing dotenv values
 * and applying CLI overrides.
 *
 * @param {Object<string,string>} parsed
 *     Parsed dotenv variables.
 *
 * @param {Object<string,string>} error
 *     Error object from dotenv, if any.
 *
 * @returns {void}
 */
const dotenvEval = ({ parsed, error }) => {
    if (error) {
        console.error(error)
        process.exit(1)
    }
    normalizeEnvFromDotenv(parsed)
    applyCliOverrides(argv)
}

export default dotenvEval
