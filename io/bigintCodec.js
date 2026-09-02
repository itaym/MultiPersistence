/**
 * Serialization codec for `[key, value]` entry arrays whose values may be
 * `BigInt`. Shared verbatim by the {@link module:io} client and its persist
 * worker so both sides agree on the on-disk format.
 *
 * BigInts are tagged with a trailing `n` (`"720n"`) so the reviver can tell
 * them apart from plain strings that merely look numeric (e.g. baseDigits'
 * `"0123"`).
 *
 * @module io/bigintCodec
 */

/** Matches a serialized BigInt: digits followed by a literal `n`, e.g. `"720n"`. */
export const BIGINT_TAG = /^-?\d+n$/

/**
 * JSON replacer: tags BigInt values with a trailing `n`.
 *
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
export const replacer = (key, value) =>
    typeof value === 'bigint' ? `${value}n` : value

/**
 * JSON reviver: converts only `n`-tagged strings back to BigInt; every other
 * value passes through untouched.
 *
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
export const reviver = (key, value) =>
    typeof value === 'string' && BIGINT_TAG.test(value) ? BigInt(value.slice(0, -1)) : value

/**
 * @param {[string, *][]} entries
 * @returns {string}
 */
export const serialize = (entries) => JSON.stringify(entries, replacer, '\t')

/**
 * @param {string} text
 * @returns {[string, *][]}
 */
export const deserialize = (text) => JSON.parse(text, reviver)
