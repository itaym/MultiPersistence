import { digitsObj as baseDigits } from '../Digits/index.js'

/**
 * Groups array items by a key returned from the callback.
 *
 * @param {function(*, number, Array): string|number} callback
 *     Function returning a group key.
 *
 * @returns {Object<string, Array<*>>}
 *     Grouped items.
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
 * Extends a constructor's toString method to support radices > 36.
 *
 * @param {{ prototype: { toString: function } }} constructor
 *     Type whose toString should be extended.
 *
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
 * Computes logarithm with an arbitrary base.
 *
 * @param {number} base
 *     Logarithmic base.
 *
 * @param {number} number
 *     Value to evaluate.
 *
 * @returns {number}
 *     Logarithm of number in the given base.
 */
function logX(base, number) {
    return Math.log(number) / Math.log(base)
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
}
