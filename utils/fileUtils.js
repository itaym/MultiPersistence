import { promises as fsPromises } from 'fs'
import fs from 'fs'
/**
 * Writes a JavaScript value to a JSON file.
 *
 * Attempts to rename the existing file to a `.bak` backup, then writes
 * the new JSON content. Backup errors are ignored.
 *
 * @param {string} filename
 *     File path.
 *
 * @param {Object|Array} value
 *     Value to serialize.
 *
 * @param {function|string[]|number[]} [replacer]
 *     Optional JSON replacer.
 *
 * @param {string|number} [space]
 *     Optional indentation.
 *
 * @param {ObjectEncodingOptions} [encoding={ encoding: 'utf8' }]
 *     File encoding.
 *
 * @returns {Promise<void>}
 */
export const writeJsonFile = async (filename, value, replacer, space, encoding = { encoding: 'utf8' }) => {
    const { normalizedEnv } = process
    if (normalizedEnv.debug === true) return

    try {
        await fsPromises.rename(filename, `${filename}.bak`)
    } catch {}
    finally {
        const json = JSON.stringify(value, replacer, space)
        await fsPromises.writeFile(filename, json, encoding)
    }
}

/**
 * Reads and parses a JSON file.
 *
 * Falls back to a `.bak` file if the main file cannot be read.
 * Returns a default value if both reads fail.
 *
 * @param {string} filename
 *     File path.
 *
 * @param {function} [reviver]
 *     Optional JSON reviver.
 *
 * @param {Object|Array} [defaultJson={}]
 *     Default value if reading fails.
 *
 * @param {ObjectEncodingOptions|string} [encoding={ encoding: 'utf8' }]
 *     File encoding.
 *
 * @returns {Promise<Object|Array>}
 *     Parsed JSON.
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
 * Synchronously reads and parses a JSON file.
 *
 * Falls back to a `.bak` file if the main file cannot be read.
 * Returns a default value if both reads fail.
 *
 * @param {string} filename
 *     File path.
 *
 * @param {function} [reviver]
 *     Optional JSON reviver.
 *
 * @param {Object|Array} [defaultJson={}]
 *     Default value if reading fails.
 *
 * @param {ObjectEncodingOptions|string} [encoding={ encoding: 'utf8' }]
 *     File encoding.
 *
 * @returns {Object|Array}
 *     Parsed JSON.
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
