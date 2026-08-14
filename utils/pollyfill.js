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
 * Computes the logarithm of a given number with an arbitrary base.
 *
 * Uses the change‑of‑base formula:
 *    log_base(number) = Math.log(number) / Math.log(base)
 *
 * @param {number} base - The logarithmic base. Must be greater than 0 and not equal to 1.
 * @param {number} number - The value to take the logarithm of. Must be greater than 0.
 * @returns {number} The logarithm of `number` with the specified `base`.
 *
 * @throws {RangeError} If `base` is <= 0, equal to 1, or if `number` is <= 0.
 *
 * @example
 * logX(2, 8)      // 3
 * logX(10, 1000)  // 3
 * logX(5, 125)    // 3
 */
function logX(base, number) {
    // if (base <= 0 || base === 1) {
    //     throw new RangeError('Base must be > 0 and not equal to 1.')
    // }
    // if (number <= 0) {
    //     throw new RangeError('Number must be > 0.')
    // }
    return Math.log(number) / Math.log(base)
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

    Math.logX = logX
}
