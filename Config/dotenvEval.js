import { argv } from 'node:process';
// noinspection ES6UnusedImports
import HugeInt from "../HugeInt/index.js";

/**
 * Safely coerce a CLI argument value into an appropriate JavaScript type.
 *
 * Coercion rules:
 *   - "true"       → true
 *   - "false"      → false
 *   - "null"       → null
 *   - "undefined"  → undefined
 *   - Numeric strings → BigInt
 *   - Everything else → raw string
 *
 * This function performs **no eval()** and is safe for untrusted input.
 *
 * @param {string} rawValue
 *     The raw value from a CLI argument (e.g., "true", "42", "fast").
 *
 * @returns {boolean|bigint|null|undefined|string}
 *     The coerced value.
 */
const coerceCliValue = (rawValue) => {
    const lower = rawValue.toLowerCase();

    if (lower === 'true') return true;
    if (lower === 'false') return false;
    if (lower === 'null') return null;
    if (lower === 'undefined') return undefined;

    try {
        return BigInt(rawValue);
    } catch {
        return rawValue;
    }
};

/**
 * Normalize and evaluate environment variables from a parsed `.env` file.
 *
 * Responsibilities:
 *   - Read key/value pairs from `parsed`
 *   - Attempt to `eval()` each value (trusted input only)
 *   - Fall back to raw string if evaluation fails
 *   - Store normalized values in `process.normalizedEnv`
 *   - Compute `goal_number = base ** goal_power_of10`
 *
 * Security:
 *   - `eval()` is safe ONLY because `.env` is trusted.
 *   - Never use this function on untrusted input.
 *
 * @param {Object<string,string>} parsed
 *     The object produced by `dotenv` containing raw environment variables.
 */
const normalizeEnvFromDotenv = (parsed) => {
    const normalizedEnv = process.normalizedEnv || {};
    process.normalizedEnv = normalizedEnv;

    for (const [key, value] of Object.entries(parsed)) {
        try {
            normalizedEnv[key.toLowerCase()] = eval(value + '');
        } catch {
            normalizedEnv[key.toLowerCase()] = value;
        }
    }

    normalizedEnv.goal_number =
        BigInt(normalizedEnv.base) ** BigInt(normalizedEnv.goal_power_of10);
};

/**
 * Apply command‑line argument overrides to normalized environment variables.
 *
 * Responsibilities:
 *   - Accept CLI args in the form `key=value`
 *   - Override ANY `.env` setting
 *   - Update both `process.normalizedEnv` and `process.env`
 *   - Recompute `goal_number` if `base` or `goal_power_of10` changes
 *
 * Notes:
 *   - Values are manually coerced using `coerceCliValue()`
 *   - No eval() is used here — safe for untrusted input
 *   - Assumes `normalizeEnvFromDotenv()` has already run
 *
 * @param {string[]} argv
 *     CLI arguments (e.g., from `process.argv.slice(2)`).
 */
const applyCliOverrides = (argv) => {
    const normalizedEnv = process.normalizedEnv || {};
    const env = process.env;

    for (const arg of argv) {
        const [key, rawValue] = arg.split('=');
        if (!key || rawValue === undefined) continue;

        const lowerKey = key.toLowerCase();
        const value = coerceCliValue(rawValue);

        normalizedEnv[lowerKey] = value;
        env[lowerKey] = value + '';
    }

    if ('base' in normalizedEnv && 'goal_power_of10' in normalizedEnv) {
        normalizedEnv.goal_number =
            BigInt(normalizedEnv.base) ** BigInt(normalizedEnv.goal_power_of10);
    }
};

/**
 * High‑level environment initializer.
 *
 * Responsibilities:
 *   1. Normalize `.env` values (trusted)
 *   2. Apply CLI overrides (untrusted)
 *   3. Produce final `process.normalizedEnv`
 *
 * Usage:
 *   dotenvEval(parsed, process.argv.slice(2))
 *
 * @param {Object<string,string>} parsed
 *     The object produced by `dotenv`.
 *
 */
const dotenvEval = (parsed) => {
    normalizeEnvFromDotenv(parsed);
    applyCliOverrides(argv);
};

export default dotenvEval
