import fs from 'fs'
import path from 'path'
import { createStore } from '../io/index.js'
import { readJsonFileSync } from './fileUtils.js'
import { writeJsonFile } from './fileUtils.js'
import { replacer, reviver } from '../io/bigintCodec.js'

/** Module URL of the codec, shared with the `io` persist worker. */
const CODEC_URL = new URL('../io/bigintCodec.js', import.meta.url).href

/**
 * Saves a Map to a JSON file.
 *
 * Legacy helper kept for `utils/mergeMaps.js`; the memoized path persists
 * through {@link module:io} instead.
 *
 * @param {string} filename - Path to the file.
 * @param {Map<string, BigInt>} map - Map to serialize.
 * @returns {void}
 */
export function saveMapToFile(filename, map) {
    writeJsonFile(filename, Array.from(map.entries()), replacer, '\t').then()
}

/**
 * Loads a Map from a JSON file. Returns an empty Map if loading fails.
 *
 * Legacy helper kept for `utils/mergeMaps.js`.
 *
 * @param {string} filename - Path to the file.
 * @returns {Map<string, BigInt>} - Loaded map.
 */
export function loadMapFromFileSync(filename) {
    try {
        const json = readJsonFileSync(filename, reviver, [])
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
 * Ensures the cache directory exists and returns its absolute path.
 *
 * @returns {string}
 */
const ensureCacheDir = () => {
    const dir = path.resolve(process.normalizedEnv.memorize_cache_dir)
    fs.mkdirSync(dir, { recursive: true })
    return dir
}

/**
 * Memoizes `fn` into a plain in-process Map, keyed by `args.join()`.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn
 * @returns {(...args: Parameters<F>) => ReturnType<F>}
 */
const memoInMemory = (fn) => {
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
 * Memoizes `fn` through an {@link module:io} store at `{cache_dir}/{name}.json`.
 *
 * The store is created on the first call, not here: `memorize()` runs while
 * Config is still bootstrapping, before `process.normalizedEnv` is populated.
 * A background worker then loads the file and rewrites it after every
 * `cache_idle_save_ms` of write-idle time (and on process exit). Calls made
 * before the file has loaded simply recompute; once it arrives, missing keys
 * are back-filled.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn
 * @param {string} name  cache file name without extension
 * @returns {(...args: Parameters<F>) => ReturnType<F>}
 */
const memoOnDisk = (fn, name) => {
    /** @type {import('../io/index.js').Store} */
    let store

    return (...args) => {
        store ??= createStore({
            file: path.join(ensureCacheDir(), `${name}.json`),
            codecUrl: CODEC_URL,
            idleMs: process.normalizedEnv.cache_idle_save_ms,
            debug: process.normalizedEnv.debug === true,
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
 * Wraps a function with memoization keyed by its `args.join()`. With a `name`,
 * the cache is disk-backed through {@link module:io}; without one it lives only
 * in memory.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn         the function to memoize
 * @param {string} [name]  cache file name (without extension); omit for memory-only
 * @returns {(...args: Parameters<F>) => ReturnType<F>} a memoized version of fn
 */
export default function memorize(fn, name) {
    if (!isValidName(name)) return memoInMemory(fn)

    if (usedNames.has(name)) {
        throw new Error(`memorize: cache file name "${name}" is already used by another memorized function`)
    }
    usedNames.add(name)

    return memoOnDisk(fn, name)
}
