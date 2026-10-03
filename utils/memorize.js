import {
    replacer,
    reviver,
} from '#io/bigintCodec.js'
import { createStore } from '#io/index.js'
import {
    readJsonFileSync, writeJsonFile,
} from './fileUtils.js'
import fs from 'node:fs'
import path from 'node:path'

/** @type {string} module URL of the codec, shared with the persist worker */
const CODEC_URL = import.meta.resolve('#io/bigintCodec.js')

/**
 * Writes `map`'s entries as JSON.
 *
 * @param {string} filename
 * @param {Map} map
 * @returns {void}
 */
export const saveMapToFile = (filename, map) => {
    writeJsonFile(filename, replacer, '\t', Array.from(map.entries())).then()
}

/**
 * Loads a Map saved by {@link saveMapToFile}, sorted by key, and saves it back sorted; empty on failure.
 *
 * @param {string} filename
 * @returns {Map}
 */
export const loadMapFromFileSync = filename => {
    try {
        const json = readJsonFileSync(filename, reviver, {})
        const entries = json.sort((a, b) => {
            if (a[0] > b[0]) return 1
            if (a[0] < b[0]) return -1
            return 0
        })
        const map = new Map(entries)
        saveMapToFile(filename, map)
        return map
    } catch {
        return new Map()
    }
}

/** @type {Set<string>} cache file names already taken */
const usedNames = new Set()

/**
 * @param {*} name
 * @returns {boolean} whether `name` is a non-empty string
 */
const isValidName = name => typeof name === 'string' && name.length > 0

/**
 * Creates the cache directory if needed.
 *
 * @returns {string} its absolute path
 */
const ensureCacheDir = () => {
    const dir = path.resolve(process.normalizedEnv.memorize_cache_dir)
    fs.mkdirSync(dir, { recursive: true })
    return dir
}

/**
 * Memorizes `fn` in memory, keyed by `args.join()`.
 *
 * @param {AnyFn} fn
 * @returns {AnyFn}
 */
const memoInMemory = fn => {
    const cache = new Map()

    return (...args) => {
        const key = args.join()
        if (cache.has(key)) return cache.get(key)

        const data = fn(...args)
        cache.set(key, data)
        return data
    }
}

/**
 * Memorizes `fn` in a disk-backed {@link Store} named `name`, keyed by `args.join()`.
 *
 * @param {AnyFn} fn
 * @param {string} name cache file name
 * @returns {AnyFn}
 */
const memoOnDisk = (fn, name) => {
    let store

    return (...args) => {
        store ??= createStore({
            codecUrl: CODEC_URL,
            debug: process.normalizedEnv.debug === true,
            file: path.join(ensureCacheDir(), `${name}.json`),
            idleMs: process.normalizedEnv.cache_idle_save_ms,
        })

        const key = args.join()
        const hit = store.get(key)
        if (hit !== undefined) return hit

        const data = fn(...args)
        store.set(key, data)
        return data
    }
}

/**
 * Memorizes `fn` on disk under `name`, or in memory when `name` is missing; throws on a reused name.
 *
 * @param {AnyFn} fn
 * @param {string} [name]
 * @returns {AnyFn}
 */
const memorize = (fn, name) => {
    if (!isValidName(name)) return memoInMemory(fn)

    if (usedNames.has(name)) {
        throw new Error(`memorize: cache file name "${name}" is already used by another memorized function`)
    }
    usedNames.add(name)

    return memoOnDisk(fn, name)
}

export default memorize
