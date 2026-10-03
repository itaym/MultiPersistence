/** @type {RegExp} a serialized BigInt: digits followed by `n`, e.g. `"720n"` */
export const BIGINT_TAG = /^-?\d+n$/

/**
 * `JSON.stringify` replacer: BigInt → `"<digits>n"`.
 *
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
export const replacer = (key, value) =>
    typeof value === 'bigint' ? `${value}n` : value

/**
 * `JSON.parse` reviver: `"<digits>n"` → BigInt.
 *
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
export const reviver = (key, value) =>
    typeof value === 'string' && BIGINT_TAG.test(value) ? BigInt(value.slice(0, -1)) : value

/**
 * Serializes entries to tab-indented JSON with BigInt tagged.
 *
 * @param {*} entries
 * @returns {string}
 */
export const serialize = entries => JSON.stringify(entries, replacer, '\t')

/**
 * Parses JSON written by {@link serialize}, restoring BigInt.
 *
 * @param {string} text
 * @returns {*}
 */
export const deserialize = text => JSON.parse(text, reviver)
