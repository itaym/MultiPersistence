import { digitsObj as baseDigits } from '../Digits/index.js'

if (!Array.prototype.group) {
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
    constructor.prototype.toString = function (radix = 10n) {
        if (radix <= 36) {
            return nativeToString.call(this, Number(radix))
        } else {
            let initBigInt
            initBigInt = BigInt(this)
            if (initBigInt === 0n) {
                return '0'
            } else {
                const bigIntBase = BigInt(radix)
                let result = []
                while (initBigInt !== 0n) {
                    const digit = Number(initBigInt % bigIntBase)
                    //if (digit === 0) return '0'
                    result.push(baseDigits.get(digit))
                    initBigInt /= bigIntBase
                }
                return result.reverse().join('')
            }
        }
    }
}
// toString(String)
toString(BigInt)
// toString(Object)

function toStrNoZero (radix = 10n) {
    let initBigInt
    initBigInt = this
    const bigIntBase = radix
    let result = []
    while (initBigInt !== 0n) {
        const digit = initBigInt % bigIntBase
        if (digit === 0n) return '0'
        result.push(baseDigits.get(digit))
        initBigInt /= bigIntBase
    }
    return result.reverse().join('')
}
BigInt.prototype.toStrNoZero = toStrNoZero