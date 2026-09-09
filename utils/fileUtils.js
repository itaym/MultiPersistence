import { promises as fsPromises } from 'fs'
import fs from 'fs'
/**
 * Writes `value` as JSON, renaming any existing file to `.bak` first.
 *
 * @param {string} filename
 * @param {Object|Array} value value to serialize
 * @param {function|string[]|number[]} [replacer] JSON replacer
 * @param {string|number} [space] indentation
 * @param {ObjectEncodingOptions} [encoding={ encoding: 'utf8' }]
 * @param {(json: string) => string} [transform] final pass over the serialized string before writing
 * @returns {Promise<void>}
 */
export const writeJsonFile = async (filename, value, replacer, space, encoding = { encoding: 'utf8' }, transform) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug === true) return

    try {
        await fsPromises.rename(filename, `${filename}.bak`)
    } catch {}
    finally {
        let json = JSON.stringify(value, replacer, space)
        if (transform) json = transform(json)
        await fsPromises.writeFile(filename, json, encoding)
    }
}

/**
 * Writes `text` to a file, renaming any existing file to `.bak` first.
 *
 * @param {string} filename
 * @param {string} text
 * @param {ObjectEncodingOptions} [encoding={ encoding: 'utf8' }]
 * @returns {Promise<void>}
 */
export const writeTextFile = async (filename, text, encoding = { encoding: 'utf8' }) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug === true) return

    try {
        await fsPromises.rename(filename, `${filename}.bak`)
    } catch {}
    finally {
        await fsPromises.writeFile(filename, text, encoding)
    }
}

/**
 * Reads and parses a JSON file, falling back to `.bak`, then to `defaultJson`.
 *
 * @param {string} filename
 * @param {function} [reviver] JSON reviver
 * @param {Object|Array} [defaultJson={}] returned when both reads fail
 * @param {ObjectEncodingOptions|string} [encoding={ encoding: 'utf8' }]
 * @returns {Promise<Object|Array>} parsed JSON
 */
export const readJsonFile = async (filename, reviver, defaultJson = {}, encoding = { encoding: 'utf8' }) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug === true) return defaultJson

    const readAndParse = async (file) => {
        const raw = await fsPromises.readFile(file, encoding)
        return JSON.parse(raw, reviver)
    }

    try {
        return await readAndParse(filename)
    }
    catch {
        try {
            return await readAndParse(`${filename}.bak`)
        }
        catch {
            return defaultJson
        }
    }
}

/**
 * Synchronous {@link readJsonFile}.
 *
 * @param {string} filename
 * @param {function} [reviver] JSON reviver
 * @param {Object|Array} [defaultJson={}] returned when both reads fail
 * @param {ObjectEncodingOptions|string} [encoding={ encoding: 'utf8' }]
 * @returns {Object|Array} parsed JSON
 */
export const readJsonFileSync = (filename, reviver, defaultJson = {}, encoding = { encoding: 'utf8' }) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug === true) return

    const readAndParse = (file) => {
        const raw = fs.readFileSync(file, encoding)
        return JSON.parse(raw, reviver)
    }

    try {
        return readAndParse(filename)
    }
    catch {
        try {
            return readAndParse(`${filename}.bak`)
        }
        catch {
            return defaultJson
        }
    }
}
