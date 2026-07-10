import { argv } from 'node:process';

/**
 * @typedef NormalizedEnv
 * @property {bigint} base
 * @property {bigint} goal_power_of10
 * @property {bigint} goal_number
 * @property {bigint} last_number
 * @property {number} log_interval
 * @property {number} memorize_save_bach
 * @property {string} vars_file
 * @property {boolean} debug
 */

/**
 *
 * @param parsed
 */
const dotenvEval = ({ parsed }) => {

    /**
     *
     * @type {NormalizedEnv}
     */
    let normalizedEnv = process.normalizedEnv || /** @type {NormalizedEnv} */ {}
    process.normalizedEnv = normalizedEnv

    for (let [key, value] of Object.entries(parsed)) {
        try {   normalizedEnv[key.toLowerCase()] = eval(value + '') }
        catch { normalizedEnv[key.toLowerCase()] = value            }
    }
    normalizedEnv.base = BigInt(normalizedEnv.base)
    normalizedEnv.goal_power_of10 = BigInt(normalizedEnv.goal_power_of10)
    normalizedEnv.goal_number = normalizedEnv.base ** normalizedEnv.goal_power_of10
    normalizedEnv.memorize_save_bach = normalizedEnv.memorize_save_bach || 100

    argv.forEach((val) => {
        const argArr = val.split('=')
         if (argArr[0] === 'base') {
            const base = BigInt(argArr[1])
            try {
                if (base > 1n || base < 65537n) {
                    normalizedEnv.base = base
                }
            }
            catch {}
        }
        if (argArr[0] === 'debug') {
            normalizedEnv.debug = argArr[1] === 'true'
        }
    })
}
export default dotenvEval
