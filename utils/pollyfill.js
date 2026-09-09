import { digitsObj as baseDigits } from '../Digits/index.js'

/**
 * Groups this array's items by the key the callback returns.
 *
 * @param {function(*, number, Array): string|number} callback returns a group key
 * @returns {Object<string, Array<*>>}
 */
function group(callback) {
    const result = {}
    this.forEach((item, index, array) => {
        const group = callback(item, index, array)
        if (!result[group]) result[group] = []
        result[group].push(item)
    })
    return result
}

/**
 * Extends `constructor.prototype.toString` to support radices > 36.
 *
 * @param {{ prototype: { toString: function } }} constructor
 * @returns {void}
 */
function toString(constructor) {
    const nativeToString = constructor.prototype.toString

    constructor.prototype.toString = function (radix = 10n) {
        if (radix <= 36) {
            return nativeToString.call(this, Number(radix))
        } else {
            let initBigInt = BigInt(this)
            if (initBigInt === 0n) return '0'

            const bigIntBase = BigInt(radix)
            let result = []

            while (initBigInt !== 0n) {
                const digit = initBigInt % bigIntBase
                result.push(baseDigits.get(digit))
                initBigInt /= bigIntBase
            }

            return result.reverse().join('')
        }
    }
}

/**
 * Logarithm of `number` in an arbitrary `base`.
 *
 * @param {number} base
 * @param {number} number
 * @returns {number}
 */
function logX(base, number) {
    return Math.log(number) / Math.log(base)
}

function rootX(root, number) {
    return number ** (1 / number);
}

/**
 * Initializes polyfills for the environment.
 *
 * @returns {void}
 */
export const initPollyFill = () => {
    if (!Array.prototype.group) {
        Array.prototype.group = group
    }

    toString(BigInt)
    Math.logX = logX
    Math.rootX = rootX
}
