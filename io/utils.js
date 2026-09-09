/**
 * Whether a key can be written as a bare identifier, without quotes.
 *
 * @param {string} key
 * @returns {boolean}
 */
const isIdent = (key) => /^[A-Za-z_$][\w$]*$/.test(key)

/**
 * Writes a value as JS source. The results file is a module — `export default
 * {...}` loaded with `import` — so a BigInt survives as a `123n` literal and
 * nothing needs a reviver.
 *
 * @param {*} value
 * @param {string} [indent] leading whitespace for the current depth
 * @returns {string}
 */
export const toJs = (value, indent = '') => {
    if (value === null || value === undefined) return 'null'   // array holes land here too
    if (typeof value === 'bigint') return `${value}n`
    if (typeof value === 'string') return JSON.stringify(value)
    if (typeof value !== 'object') return String(value)

    const type = value.constructor?.name
    if (type === 'HugeInt' || type === 'HugeIntEx') return `${value.value}n`

    const pad = indent + '\t'

    if (Array.isArray(value)) {
        if (!value.length) return '[]'
        const items = []
        for (let i = 0; i < value.length; i++) items.push(pad + toJs(value[i], pad))
        return `[\n${items.join(',\n')}\n${indent}]`
    }

    const keys = Object.keys(value)
    if (!keys.length) return '{}'
    const body = keys
        .map((key) => `${pad}${isIdent(key) ? key : JSON.stringify(key)}: ${toJs(value[key], pad)}`)
        .join(',\n')
    return `{\n${body}\n${indent}}`
}
