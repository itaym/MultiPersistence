import { promises as fs } from 'fs'

/**
 * @typedef {object} Iterations
 * @property {bigint} calculated
 * @property {number} count
 * @property {number} found_nothing
 * @property {number} found_nothing_break_at
 */

/**
 * @typedef {object} TypeStep
 * @property {number} [atRunTime]
 * @property {bigint} combinations
 * @property {number} count
 * @property {bigint} first
 * @property {number} [iteration]
 * @property {bigint} last
 * @property {number} [step]
 */

/**
 * @typedef {object} LengthProps
 * @property {number} found
 * @property {number} time
 * @property {TypeStep} steps
 */

/**
 * @typedef {Object<string, number>} NumberLengths
 * @property {LengthProps} [key]
 */

/**
 * @typedef {object} InitVars
 * @property {bigint} base
 * @property {Iterations} iterations
 * @property {bigint} last_number
 * @property {object} number_lengths
 * @property {TypeStep[]} steps
 */

/**
 *
 * @param key {string}
 * @param value {*}
 * @returns {bigint|*}
 */
const reviver = (key, value) => {
    switch (key) {
        case 'base':
        case 'calculated':
        case 'combinations':
        case 'first':
        case 'iteration':
        case 'last':
        case 'last_number':
            return BigInt(value)
    }
    return value
}

/**
 *
 * @returns {Promise<InitVars>}
 */
export const getInitVars = async () => {

    const { normalizedEnv } = process
    const { vars_file } = normalizedEnv
    let fileName = `./results/${normalizedEnv.base.toString().padStart(5, '0')}_${vars_file}`

    let defaultVars = {
        base: normalizedEnv.base,
        iterations: {
            calculated: 0n,
            count: 0,
            found_nothing: 0,
            found_nothing_break_at: 1_000,
        },
        last_number: normalizedEnv.debug ? normalizedEnv.last_number: 0n,
        number_lengths: {},
        up_time: 0,
        steps: [],
    }
    if (normalizedEnv.debug) return defaultVars
    try {
        let data = await fs.readFile(fileName, 'utf-8')
        defaultVars = JSON.parse(data, reviver)
    } catch  {
        fileName = fileName.replace('json', 'bak')
        try {
            let data = await fs.readFile(fileName, 'utf-8')
            defaultVars = JSON.parse(data, reviver)
        } catch  {}
    }
    return defaultVars
}

/**
 *
 * @param key {string}
 * @param value {*}
 * @returns {bigint|*}
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
 * @param {InitVars} initVars
 * @param {bigint} base
 * @returns {Promise<void>}
 */
export const setInitVars = async (initVars, base) => {
    const { normalizedEnv } = process
    const fileName = `./results/${base.toString().padStart(5, '0')}_${normalizedEnv.vars_file}`
    try {
        await fs.rename(fileName, fileName.replace('.json', '.bak'))
    } catch {}
    await fs.writeFile(fileName, JSON.stringify(initVars, replacer, '\t'))
}