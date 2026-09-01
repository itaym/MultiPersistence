import fs from 'fs'
import path from 'path'
import {readJsonFileSync, writeJsonFile} from './fileutils.js'

/**
 * JSON replacer for serializing BigInt values.
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
 * @returns {function(string, *): *} - Reviver function.
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
 * @param {string} filename - Path to the file.
 * @param {Map<string, BigInt>} map - Map to serialize.
 *
 * @returns {void}
 */
export function saveMapToFile(filename, map) {
    writeJsonFile(filename, Array.from(map.entries()), replacer, '\t').then()
}

/**
 * Loads a Map from a JSON file.
 * Returns an empty Map if loading fails.
 *
 * @param {string} filename - Path to the file.
 *
 * @returns {Map<string, BigInt>} - Loaded map.
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

const usedNames = new Set()

/**
 * Checks whether a cache `name` is usable as a file name.
 *
 * @param {*} name
 * @returns {boolean}
 */
const isValidName = (name) => typeof name === 'string' && name.length > 0

/**
 * Wraps a function with disk-backed memoization, keyed by its `args.join()`.
 * When `name` is given, the cache is loaded from
 * `{normalizedEnv.memorize_cache_dir}/{name}.json` up front and re-persisted every
 * `batchSize` new entries — so `initConfig()` must have run before `memorize()`.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn         the function to memoize
 * @param {string} name  cache file name (without extension), used as `{cache_dir}/{name}.json`
 * @param {number} [batchSize]  new entries between disk writes; defaults to `normalizedEnv.memorize_save_bach`
 * @returns {(...args: Parameters<F>) => ReturnType<F>} a memoized version of fn
 */
export default function memorize(fn, name, batchSize = undefined) {
    const useDiskCache = isValidName(name)

    if (useDiskCache) {
        if (usedNames.has(name)) {
            throw new Error(`memorize: cache file name "${name}" is already used by another memorized function`)
        }
        usedNames.add(name)
    }

    /** @type {string|null} */
    let fileName = null
    let cache = new Map()
    let setCounter = 0

    if (useDiskCache) {
        const cacheDir = path.resolve(process.normalizedEnv.memorize_cache_dir)
        fs.mkdirSync(cacheDir, { recursive: true })
        fileName = path.join(cacheDir, `${name}.json`)
        cache = loadMapFromFileSync(fileName)
    }

    return function (...args) {
        const key = args.join()

        let data = cache.get(key)
        if (data !== undefined) return data

        data = fn(...args)
        cache.set(key, data)

        if (useDiskCache) {
            const saveBachSize = batchSize ?? process.normalizedEnv.memorize_save_bach

            if (!(++setCounter % saveBachSize))
                saveMapToFile(fileName, cache)
        }

        return data
    }
}