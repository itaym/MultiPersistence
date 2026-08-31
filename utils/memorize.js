import path from 'path'
import {readJsonFileSync, writeJsonFile} from './fileutils.js'

/**
 * JSON replacer for serializing BigInt values.
 *
 * Converts BigInt to string for JSON compatibility.
 *
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
const replacer = (key, value) => {
    const name = value?.constructor?.name
    if (name === 'BigInt') return value.toString()
    return value
}

/**
 * JSON reviver for deserializing BigInt values.
 *
 * @returns {function(string, *): *}
 *     Reviver function.
 */
const reviver = () => {
    let toggle = 0
    return (key, value) => {
        toggle++
        if (toggle === 2) {
            toggle = -1
            return BigInt(value)
        }
        return value
    }
}

/**
 * Saves a Map to a JSON file.
 *
 * @param {string} filename
 *     Path to the file.
 *
 * @param {Map<string, BigInt>} map
 *     Map to serialize.
 *
 * @returns {void}
 */
export function saveMapToFile(filename, map) {
    writeJsonFile(filename, Array.from(map.entries()), replacer, '\t').then()
}

/**
 * Loads a Map from a JSON file.
 *
 * Returns an empty Map if loading fails.
 *
 * @param {string} filename
 *     Path to the file.
 *
 * @returns {Map<string, BigInt>}
 *     Loaded map.
 */
export function loadMapFromFileSync(filename) {
    try {
        const json = readJsonFileSync(filename, reviver(), [])
        const entries = json.sort((a, b) => {
            if (a[0] > b[0]) return 1
            if (a[0] < b[0]) return -1
            return 0
        })
        const map = new Map(entries)
        saveMapToFile(filename, map)
        return map
    }
    catch {
        return new Map()
    }
}

/**
 * Wraps a function with disk-backed memoization, keyed by its JSON.stringify args.
 * Periodically persists the cache to `./caching/{name}.json` every
 * `normalizedEnv.memorize_save_bach` sets.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn - the function to memoize
 * @param {string} name - cache file name (without extension), used as `./caching/{name}.json`
 * @returns {(...args: Parameters<F>) => ReturnType<F>} a memoized version of fn
 */
export default function memorize(fn, name) {
    const fileName = path.join(path.resolve('./caching'), `${name}.json`)
    const cache = loadMapFromFileSync(fileName)
    let setCounter = 0

    return function (...args) {
        const { normalizedEnv } = process
        const saveToFile = normalizedEnv.memorize_save_bach

        const key = args.join()
        let data = cache.get(key)
        if (data) return data

        data = fn(...args)
        cache.set(key, data)
        setCounter++

        if (!(setCounter % saveToFile))
            saveMapToFile(fileName, cache)

        return data
    }
}