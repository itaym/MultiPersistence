// noinspection ES6UnusedImports

// eslint-disable-next-line no-unused-vars
import HugeInt from '#HugeInt/index.js'
import toJs from '#io/utils.js'
import {
    importJsFile,
    writeTextFile,
} from '#utils/fileUtils.js'

/**
 * `./results/<base 5-digit>_<results_file>`; append `.js` / `.js.bak`.
 *
 * @param {bigint} base
 * @returns {string}
 */
const resultsStem = base =>
    `./results/${base.toString().padStart(5, '0')}_${process.normalizedEnv.results_file}`

/**
 * Saved state for the env's base, back-filled for older files, or a fresh one (always fresh in debug).
 *
 * @returns {Promise<ComputationState>}
 */
export const getComputationState = async () => {
    const { normalizedEnv } = process

    /** @type {ComputationState} */
    const defaultVars = {
        iterations: {
            actual: 0n,
            count: 0,
            found_nothing: 0,
            found_nothing_break_at: normalizedEnv.found_nothing_break_at,
        },
        last_number: normalizedEnv.last_number,
        number_lengths: {},
        pseudoGoal: normalizedEnv.pseudo_goal_number,
        range_start: 0n,
        steps: [],
        up_time: 0,
    }

    if (normalizedEnv.debug) return defaultVars

    /**
     * Fills fields missing from older state files, in place.
     *
     * @param {ComputationState} state
     * @returns {ComputationState} `state`
     */
    const backFill = state => {
        state.iterations.actual ??= state.iterations.calculated
        state.pseudoGoal ??= normalizedEnv.pseudo_goal_number
        state.range_start ??= 0n
        return state
    }

    try {
        return backFill(await importJsFile(resultsStem(normalizedEnv.base)))
    } catch {
        return defaultVars
    }
}

/**
 * Writes `computationState` to the results file of `base`.
 *
 * @param {bigint} base
 * @param {ComputationState} computationState
 * @returns {Promise<void>}
 */
export const saveComputationState = async (base, computationState) => {
    await writeTextFile(`${resultsStem(base)}.js`, `export default ${toJs(computationState)}\n`)
}
