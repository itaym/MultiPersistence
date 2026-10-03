import initPollyFill from '#utils/pollyfill.js'
import dotenvEval from './dotenvEval.js'
import * as dotenv from 'dotenv'

/** @type {NormalizedEnv|undefined} loaded env, set on first access */
let normalizedEnv

initPollyFill()

/**
 * Loads `.env` and normalizes it.
 *
 * @param {Object} [options] `dotenv.config` options
 * @returns {NormalizedEnv|undefined}
 */
const load = options => {
    normalizedEnv = dotenvEval(dotenv.config(options))
    return normalizedEnv
}

Object.defineProperty(process, 'normalizedEnv', {
    configurable: true,
    /**
     * @returns {NormalizedEnv}
     */
    get: () => normalizedEnv ?? load(),
    /**
     * @param { normalizedEnv|undefined} value
     */
    set: value => { normalizedEnv = value },
})

/**
 * Loads the env once, if not loaded yet.
 *
 * @param {Object} [options] `dotenv.config` options
 * @returns {void}
 */
const initConfig = options => {
    if (!normalizedEnv) load(options)
}

export default initConfig
