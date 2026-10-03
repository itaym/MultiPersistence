import fs, { promises as fsPromises } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Default export of `<stem>.js`, falling back to `<stem>.js.bak`.
 *
 * @param {string} stem path without extension
 * @returns {Promise<*>}
 */
export const importJsFile = async stem => {
    try {
        return (await import(pathToFileURL(resolve(`${stem}.js`)).href)).default
    } catch {}

    const src = await fsPromises.readFile(`${stem}.js.bak`, 'utf8')
    return (await import(`data:text/javascript,${encodeURIComponent(src)}`)).default
}

/**
 * Writes `value` as JSON, keeping the previous file as `.bak`; no-op in debug.
 *
 * @param {string} filename
 * @param {((key: string, value: *) => *)|Array|null} replacer `JSON.stringify` replacer
 * @param {string|number} space `JSON.stringify` indentation
 * @param {*} value
 * @param {Object|string} [encoding={ encoding: 'utf8' }]
 * @param {(json: string) => string} [transform] applied to the JSON before writing
 * @returns {Promise<void>}
 */
// eslint-disable-next-line default-param-last
export const writeJsonFile = async (filename, replacer, space, value, encoding = { encoding: 'utf8' }, transform) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug) return

    try {
        await fsPromises.rename(filename, `${filename}.bak`)
    } catch {} finally {
        let json = JSON.stringify(value, replacer, space)
        if (transform) json = transform(json)
        await fsPromises.writeFile(filename, json, encoding)
    }
}

/**
 * Writes `text`, keeping the previous file as `.bak`; no-op in debug.
 *
 * @param {string} filename
 * @param {string} text
 * @param {Object|string} [encoding={ encoding: 'utf8' }]
 * @returns {Promise<void>}
 */
export const writeTextFile = async (filename, text, encoding = { encoding: 'utf8' }) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug) return

    try {
        await fsPromises.rename(filename, `${filename}.bak`)
    } catch {} finally {
        await fsPromises.writeFile(filename, text, encoding)
    }
}

/**
 * Parsed JSON of `filename`, else of its `.bak`, else `defaultJson` (also in debug).
 *
 * @param {string} filename
 * @param {(key: string, value: *) => *} reviver `JSON.parse` reviver
 * @param {Object|Array} [defaultJson={}]
 * @param {Object|string} [encoding={ encoding: 'utf8' }]
 * @returns {Promise<Object|Array>}
 */
export const readJsonFile = async (filename, reviver, defaultJson = {}, encoding = { encoding: 'utf8' }) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug) return defaultJson

    /**
     * @param {string} file
     * @returns {Promise<*>}
     */
    const readAndParse = async file => {
        const raw = await fsPromises.readFile(file, encoding)
        return JSON.parse(raw, reviver)
    }

    try {
        return await readAndParse(filename)
    } catch {
        try {
            return await readAndParse(`${filename}.bak`)
        } catch {
            return defaultJson
        }
    }
}

/**
 * Sync {@link readJsonFile}; `undefined` in debug.
 *
 * @param {string} filename
 * @param {(key: string, value: *) => *} reviver `JSON.parse` reviver
 * @param {Object|Array} [defaultJson={}]
 * @param {Object|string} [encoding={ encoding: 'utf8' }]
 * @returns {Object}
 */
export const readJsonFileSync = (filename, reviver, defaultJson = {}, encoding = { encoding: 'utf8' }) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug) return defaultJson

    /**
     * @param {string} file
     * @returns {Object}
     */
    const readAndParse = file => {
        const raw = /** @type {string} */fs.readFileSync(file, encoding)
        return JSON.parse(raw, reviver)
    }

    try {
        return readAndParse(filename)
    } catch {
        try {
            return readAndParse(`${filename}.bak`)
        } catch {
            return defaultJson
        }
    }
}
