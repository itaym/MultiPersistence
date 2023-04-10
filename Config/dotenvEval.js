/**
 *
 * @typedef {Object} Environment
 * @property {string} CREATE_PERMUTATIONS
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
 * @property {boolean} CREATE_PERMUTATIONS
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
}
export default dotenvEval