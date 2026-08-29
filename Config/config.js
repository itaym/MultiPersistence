import * as dotenv from 'dotenv'
import { initPollyFill } from '../utils/pollyfill.js'
import dotenvEval from './dotenvEval.js'

let executed = false

/**
 * Initializes application configuration once.
 *
 * Loads polyfills and environment variables, ensuring initialization
 * is performed only a single time.
 *
 * @param {object} [options]
 *     Optional configuration passed to dotenv.
 *
 * @returns {void}
 */
export const initConfig = (options = undefined) => {
    if (executed) return
    initPollyFill()
    dotenvEval(/** @type any */ dotenv.config(options))
}

