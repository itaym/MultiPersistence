import * as dotenv from 'dotenv'
import dotenvEval from './dotenvEval.js'
dotenvEval(dotenv.config())

const saveConsoleLog = console.log

console.log = (...args) => {
    const newArgs = []

    args.forEach(arg => {
        if (typeof arg === 'string')
        for (let x = 7; x < 15; x++) {
            if (x === 10) continue
            arg = arg.replaceAll(String.fromCharCode(x), 'X')
        }
        newArgs.push(arg)
        saveConsoleLog(...newArgs)
    })
}

export const config = {}