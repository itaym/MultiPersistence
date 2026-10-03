/* eslint-disable no-unused-vars */
// noinspection ES6UnusedImports
import HugeInt from '#HugeInt/index.js'
import { argv } from 'node:process'

/**
 * Command-line value → boolean, null, undefined, BigInt, or the raw string.
 *
 * @param {string} rawValue
 * @returns {*}
 */
const coerceCliValue = rawValue => {
    const lower = rawValue.toLowerCase()

    const expectedRawValues = ['true', 'false', 'undefined', 'null']

    if (expectedRawValues.includes(lower)) {
        // eslint-disable-next-line no-eval
        return eval(lower)
    }

    try {
        return BigInt(rawValue)
    } catch {
        return rawValue
    }
}

/**
 * Lower-cases the keys and evaluates each value as JS, keeping the raw string when that fails.
 *
 * @param {Object<string, string>} parsed
 * @returns {NormalizedEnv}
 */
const normalizeEnvFromDotenv = parsed => {
    const normalizedEnv = {}

    for (const [key, value] of Object.entries(parsed)) {
        try {
            // eslint-disable-next-line no-eval
            normalizedEnv[key.toLowerCase()] = eval(value + '')
        } catch {
            normalizedEnv[key.toLowerCase()] = value
        }
    }

    return normalizedEnv
}

/**
 * Applies `key=value` command-line args to `normalizedEnv` and `process.env`, in place.
 *
 * @param {string[]} args
 * @param {NormalizedEnv} normalizedEnv
 * @returns {NormalizedEnv} `normalizedEnv`
 */
const applyCliOverrides = (args, normalizedEnv) => {
    const { env } = process

    for (const arg of argv) {
        const [key, rawValue] = arg.split('=')
        if (!key || rawValue === undefined) continue

        const lowerKey = key.toLowerCase()
        const value = coerceCliValue(rawValue)

        normalizedEnv[lowerKey] = value
        env[lowerKey] = value + ''
    }

    return normalizedEnv
}

/**
 * Turns a `dotenv.config` result into the normalized env with command-line overrides; exits on a load error.
 *
 * @param {DotenvResult} result
 * @returns {NormalizedEnv}
 */
const dotenvEval = ({ error, parsed }) => {
    if (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        process.exit(1)
    }
    return applyCliOverrides(argv, normalizeEnvFromDotenv(parsed))
}

export default dotenvEval
