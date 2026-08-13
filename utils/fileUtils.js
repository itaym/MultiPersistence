import { promises as fsPromises } from 'fs'
import fs from 'fs'
/**
 * Writes a JavaScript value to a file as JSON. Before writing, the function
 * attempts to rename the existing file to a `.bak` backup. If the backup step
 * fails (e.g., the file does not exist), the error is ignored.
 *
 * @param {string} filename
 *        The path to the file to write.
 *
 * @param {Object|Array} value
 *        The JavaScript value to serialize as JSON.
 *
 * @param {function|string[]|number[]} [replacer]
 *        Optional JSON replacer function or whitelist array.
 *
 * @param {string|number} [space]
 *        Optional indentation or whitespace for pretty-printing.
 *
 * @param {ObjectEncodingOptions} [encoding='utf8']
 *        The encoding to use when writing the file.
 *
 * @returns {Promise<void>}
 *        Resolves when the file has been backed up (if possible) and written.
 *        ascii, utf8, utf-8, utf16le, utf-16le, ucs2, ucs-2, base64, base64url, latin1, binary, hex.
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
 * Reads and parses a JSON file. If the main file cannot be read, the function
 * attempts to read a `.bak` backup file instead. If both reads fail, the
 * provided default JSON value is returned. The parsed result is processed with
 * an optional JSON reviver function.
 *
 * @param {string} filename
 *        The path to the JSON file to read.
 *
 * @param {function(key: string, value: any)} [reviver]
 *        Optional JSON reviver function applied during parsing.
 *
 * @param {Object|Array} [defaultJson={}]
 *        Value returned if neither the main file nor the backup file can be read.
 *
 * @param {ObjectEncodingOptions|string} [encoding={ encoding: 'utf8' }]
 *        Encoding used when reading the main file.
 *
 * @returns {Promise<Object|Array>}
 *        The parsed JSON object or array.
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
    catch(e) {
        try {
            return await readAndParse(`${filename}.bak`)
        }
        catch {
            return defaultJson
        }
    }
}

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
