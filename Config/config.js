import * as dotenv from 'dotenv'
import { initPollyFill } from '../utils/pollyfill.js'
import dotenvEval from './dotenvEval.js'

let normalizedEnv

initPollyFill()

const load = (options) => {
    normalizedEnv = dotenvEval(/** @type any */ dotenv.config(options))
    return normalizedEnv
}

Object.defineProperty(process, 'normalizedEnv', {
    configurable: true,
    get: () => normalizedEnv ?? load(),
    set: (value) => { normalizedEnv = value },
})

/**
 * Triggers config loading if it hasn't run yet. Runs at most once.
 *
 * @param {object} [options] passed to `dotenv.config`
 * @returns {void}
 */
export const initConfig = (options = undefined) => {
    if (!normalizedEnv) load(options)
}

