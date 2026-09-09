import { argv } from 'node:process'
// noinspection ES6UnusedImports
import HugeInt from '../HugeInt/index.js'

/**
 * Coerces a CLI argument string to boolean, null, undefined, BigInt, or the raw string.
 *
 * @param {string} rawValue
 * @returns {boolean|bigint|null|undefined|string}
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
 * Evals each dotenv value into `process.normalizedEnv` (trusted input) and derives `goal_number`.
 *
 * @param {Object<string,string>} parsed raw dotenv variables
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
 * Applies `key=value` CLI args to `normalizedEnv` and `process.env`, re-deriving `goal_number`.
 *
 * @param {string[]} argv
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
 * Normalizes dotenv values then applies CLI overrides. Exits on a dotenv error.
 *
 * @param {Object<string,string>} parsed parsed dotenv variables
 * @param {Object<string,string>} error dotenv error, if any
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
