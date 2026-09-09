import * as dotenv from 'dotenv'
import { initPollyFill } from '../utils/pollyfill.js'
import dotenvEval from './dotenvEval.js'

let executed = false

/**
 * Loads polyfills and environment variables. Runs at most once.
 *
 * @param {object} [options] passed to `dotenv.config`
 * @returns {void}
 */
export const initConfig = (options = undefined) => {
    if (executed) return
    initPollyFill()
    dotenvEval(/** @type any */ dotenv.config(options))
}

