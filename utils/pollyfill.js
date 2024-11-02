import { digitsObj as baseDigits } from '../Digits/index.js'
/**
 * @typedef {Object<string>[]} NumberLengths
 * @property {LengthProps} [key]
 */
if (!Array.prototype.group) {
    /**
     *
     * @param callback
     * @returns {Object<string>[]}
     */
    Array.prototype.group = function(callback) {
        const result = {}
        this.forEach((item, index, array) => {
            const group = callback(item, index, array)
            if (!result[group]) result[group] = []
            result[group].push(item)
        })
        return result
    }
}

function toString(constructor) {
    const nativeToString = constructor.prototype.toString
    /**
     *
     * @param {bigint} radix
     * @returns {string}
     */
    constructor.prototype.toString = function (radix = 10n) {
        if (radix <= 36) {
            return nativeToString.call(this, Number(radix))
        } else {
            let initBigInt
            initBigInt = BigInt(/** @type {*} */ this)
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

toString(BigInt)
