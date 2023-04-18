import HugeInt from '../HugeInt/HugeInt.js'
import { promises as fs } from 'fs'

/**
 * An object containing information about an iterative process.
 * @typedef {Object} IterationStep
 * @property {number} IterationStep[].atRunTime - The amount of time it took to reach to this point in milliseconds.
 * @property {number} IterationStep[].count - The number of times the step was found.
 * @property {number} IterationStep[].iteration - The iteration number that the step occurred in.
 * @property {string} IterationStep[].combinations - The amount of numbers permutations found.
 * @property {string} IterationStep[].first - The first number found for this step.
 * @property {string} IterationStep[].last - The last number found for this step.
 * @property {string} IterationStep[].step - The step this object represent.
 */
/**
 * An object containing information about an iterative process.
 * @typedef {Object} IterationData
 * @property {number} BASE - The base number used in the iteration.
 * @property {number} COUNT_ITERATIONS - The base number used in the iteration.
 * @property {number} CALC_ITERATIONS - The number of iterations performed.
 * @property {number} ITERATIONS_NOT_FOUND - The number of iterations performed.
 * @property {number} ITERATIONS_NOT_FOUND_LIMIT - The number of iterations performed.
 * @property {string} LAST_FOUND - The last number found in the iteration.
 * @property {number} MAX_STEPS - The maximum number of steps found in the iteration.
 * @property {bigint} NUMBER - The latest number used in the iteration.
 * @property {number} UP_TIME_MILLISECONDS - The amount of time the iteration took in milliseconds.
 * @property {IterationStep[]} STEPS - An array of objects representing each step in the iteration.
 */

let base
/**
 *
 * @param key {string}
 * @param value {string}
 * @return {bigint|*|HugeInt}
 */
const reviver = (key, value) => {
    switch (key) {
        case 'BASE':
            base = value * 1
            break
        case 'LAST_FOUND':
        case 'first':
        case 'last':
            return BigInt(value)
        case 'CALC_ITERATIONS':
        case 'NUMBER':
        case 'combinations':
        case 'iteration':
            return BigInt(value)
    }
    return value
}

/**
 *
 * @param base {number}
 * @return {Promise<IterationData|{}>}
 */
export const getInitVars = async (base) => {
    const fileName = `./results/${base.toString().padStart(5, '0')}_${process.env.INIT_VARS_FILE}`
    try {
        let data = await fs.readFile(fileName, 'utf-8')
        data = JSON.parse(data, reviver)
        return data
    } catch {
        return {}
    }
}

/**
 *
 * @param key {string}
 * @param value {string|*}
 * @return {string|*}
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
 *
 * @param initVars {IterationData}
 * @param base {number}
 * @return {Promise<void>}
 */
export const setInitVars = async (initVars, base) => {
    const fileName = `./results/${base.toString().padStart(5, '0')}_${process.env.INIT_VARS_FILE}`
    await fs.writeFile(fileName, JSON.stringify(initVars, replacer, '\t'))
}