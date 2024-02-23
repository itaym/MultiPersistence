import * as dotenv from 'dotenv'
import dotenvEval from './dotenvEval.js'

dotenvEval(dotenv.config())

export const config = {}