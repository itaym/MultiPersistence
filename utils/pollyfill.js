import { digitsObj as baseDigits } from '../Digits/index.js'

/**
 * Polyfill for `Array.prototype.group`.
 *
 * Groups array items by a key returned from the callback function.
 * The callback receives `(item, index, array)` and must return a group key.
 *
 * @param {function(*, number, Array): string|number} callback
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
 * Extends the `.prototype.toString` method of a built‑in type (such as BigInt)
 * to support arbitrary radices greater than 36.
 *
 * The provided `constructor` is not required to be a classical function
 * constructor — it only needs to expose a `.prototype.toString` method that
 * can be overridden.
 *
 * Behavior:
 *   - If radix ≤ 36 → delegate to the native `.toString`.
 *   - If radix > 36 → convert using the custom digit map from `Digits/index.js`.
 *
 * This enables BigInt (and potentially other types) to render values in
 * arbitrary bases using user‑defined digit symbols.
 *
 * @param {{ prototype: { toString: function } }} constructor
 *     Any object whose `.prototype.toString` method should be extended.
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
            if (initBigInt === 0n) {
                return '0'
            } else {
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
}

/**
 * Initialize polyfills for the runtime environment.
 *
 * @returns {void}
 */
export const initPollyFill = () => {
    if (!Array.prototype.group) {
        Array.prototype.group = group
    }
    toString(BigInt)
}
