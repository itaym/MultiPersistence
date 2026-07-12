import * as dotenv from 'dotenv'
import { initPollyFill } from '../utils/pollyfill.js'
import dotenvEval from './dotenvEval.js'

let executed = false;

/**
 * Initialize application configuration.
 *
 * This function ensures that environment variables and polyfills are loaded
 * exactly once. It performs three steps:
 *
 *   1. Prevents repeated initialization using an internal `executed` flag.
 *   2. Loads custom polyfills via `initPollyFill()`.
 *   3. Loads and evaluates environment variables using:
 *        dotenv.config() → dotenvEval()
 *
 * This setup allows environment variables to contain expressions or computed
 * values, which `dotenvEval` resolves after parsing.
 *
 * @returns {void}
 */
export const initConfig = () => {
    if (executed) return
    initPollyFill()
    dotenvEval(dotenv.config())
}
