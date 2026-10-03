/**
 * Whether `key` can be written as an unquoted object key.
 *
 * @param {string} key
 * @returns {boolean}
 */
const isIdent = key => /^[A-Za-z_$][\w$]*$/.test(key)

/**
 * JS source for `value`: BigInt as `n` literals, HugeInt as their value, tab-indented.
 *
 * @param {*} value
 * @param {string} [indent=''] current indentation
 * @returns {string}
 */
const toJs = (value, indent = '') => {
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
        .map(key => `${pad}${isIdent(key) ? key : JSON.stringify(key)}: ${toJs(value[key], pad)}`)
        .join(',\n')
    return `{\n${body}\n${indent}}`
}

export default toJs
