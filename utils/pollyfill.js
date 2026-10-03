import { digitsObj as baseDigits } from '#Digits/index.js'

/**
 * `Array.prototype.group` polyfill: groups items by `callback`'s result.
 *
 * @this {Array}
 * @param {(item: *, index: number, array: Array) => string} callback
 * @returns {Object<string, Array>}
 */
function group(callback) {
    const result = {}
    this.forEach((item, index, array) => {
        const callbackResult = callback(item, index, array)
        if (!result[callbackResult]) result[callbackResult] = []
        result[callbackResult].push(item)
    })
    return result
}

/**
 * Patches `constructor.prototype.toString` to support radixes above 36 via the `Digits` map.
 *
 * @param {Object} constructor
 * @returns {void}
 */
const toString = constructor => {
    const nativeToString = constructor.prototype.toString

    /**
     * @param {bigint|number} [radix=10n]
     * @returns {string}
     */
    constructor.prototype.toString = function (radix = 10n) {
        if (radix <= 36) {
            return nativeToString.call(this, Number(radix))
        }
        let initBigInt = BigInt(this)
        if (initBigInt === 0n) return '0'

        const bigIntBase = BigInt(radix)
        const result = []

        while (initBigInt !== 0n) {
            const digit = initBigInt % bigIntBase
            result.push(baseDigits.get(digit))
            initBigInt /= bigIntBase
        }

        return result.reverse().join('')
    }
}

/**
 * `Math.logX`: logarithm of `number` in `base`.
 *
 * @param {number} base
 * @param {number} number
 * @returns {number}
 */
const logX = (base, number) => Math.log(number) / Math.log(base)

/**
 * `Math.rootX`: `root`-th root of `number`.
 *
 * @param {number} number
 * @param {number} root
 * @returns {number}
 */
const rootX = (number, root) => number ** (1 / root)

/**
 * Installs the polyfills: `Array.prototype.group`, BigInt `toString` radix > 36, `Math.logX`, `Math.rootX`.
 *
 * @returns {void}
 */
const initPollyFill = () => {
    if (!Array.prototype.group) {
        // eslint-disable-next-line no-extend-native
        Array.prototype.group = group
    }

    toString(BigInt)
    Math.logX = logX
    Math.rootX = rootX
}

export default initPollyFill
