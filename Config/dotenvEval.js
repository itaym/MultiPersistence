import { argv } from 'node:process';

/**
 *
 * @typedef {Object} Environment
 * @property {string} DEBUG
 * @property {string} INIT_BASE
 * @property {string} INIT_GOAL_POWER_OF10
 * @property {string} INIT_CALC_ITERATIONS
 * @property {string} INIT_MAX_STEPS
 * @property {string} INIT_NUMBER
 * @property {string} INIT_UP_TIME_MILLISECONDS
 * @property {string} INIT_VARS_FILE
 */

/**
 *
 * @typedef {Object} SelfEnv
 * @augments Environment
 * @property {boolean} DEBUG
 * @property {number} INIT_BASE
 * @property {bigint} INIT_GOAL_NUMBER
 * @property {bigint} INIT_GOAL_POWER_OF10
 * @property {number} INIT_CALC_ITERATIONS
 * @property {number} INIT_MAX_STEPS
 * @property {bigint} INIT_NUMBER
 * @property {number} INIT_UP_TIME_MILLISECONDS
 */

/**
 *
 * @param parsed {Environment|*}
 */
const dotenvEval = ({ parsed }) => {
    if (!process.selfEnv) process.selfEnv = {}

    for (let [key, value] of Object.entries(parsed)) {
        try {
            process.selfEnv[key] = eval(value + '')
        }
        catch {
            process.selfEnv[key] = value
        }
    }
    process.selfEnv.INIT_GOAL_NUMBER = BigInt(process.selfEnv.INIT_BASE) ** BigInt(process.selfEnv.INIT_GOAL_POWER_OF10)

    // print process.argv
    argv.forEach((val, index) => {
        const argArr = val.split('=')
        if (argArr[0] === 'base') {
            const base = parseInt(argArr[1])
            try {
                if (base > 2 || base < 65537) {
                    process.selfEnv.INIT_BASE = base
                    process.env.INIT_BASE = base
                }
            }
            catch {}
        }
        if (argArr[0] === 'debug') {
            const debug = eval(argArr[1])
            try {
                if (debug !== undefined) {
                    process.selfEnv.DEBUG = !!debug
                    process.env.DEBUG = !!debug
                }
            }
            catch {}
        }
    })
}
export default dotenvEval