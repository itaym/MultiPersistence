import { digitsValue } from '../Digits/index.js'
import { memorizeForPowerBy } from '../utils/memorize.js'

const powerBy = memorizeForPowerBy('powerBy')

const convertToPowerArray = (() => {
    const splitRegEx = /((.)\2*)/g
    const  tbi = []
    for (let int = 0; int < 1_000; int++) {
        tbi.push(BigInt(int))
    }
    return function (str) {
        const result = []
        const arr = str.split('').sort().join('').match(splitRegEx) || '1'

        for (let str of arr) {
            result.push(powerBy(digitsValue[str[0]], tbi[str.length]))
        }
        return result
    }
})()

const arrayWithZero = [0n]
const replace1RegEx = /1/g
function bigIntCreatePowerArray(currentNo, base) {
    let currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    currentNoStr = currentNoStr.replace(replace1RegEx, '')

    return convertToPowerArray(currentNoStr)
}

function hugeIntMap({ count, digit }) { return powerBy(digit ,count) }

function hugeIntCreatePowerArray(hugeInt) {
    return mapHugeInt(hugeInt, hugeIntMap)
}

function reduce(arr) {
    let result = arr[0]
    for (let x = 1; x < arr.length; x++) {
        result *= arr[x]
    }
    return result
}

function mapHugeInt(hugeInt, fn) {
    const result = []
    const arr = hugeInt.cellsArr
    for (let x = 0 + hugeInt.startIndex; x < arr.length; x++) {
        result.push(fn(arr[x]))
    }
    return result
}

export const multiPer = function (currentNo, base) {
    if (currentNo.isLTBase()) return 0

    return multiPerNoBaseCheck(currentNo, base)
}
export const multiPerNoBaseCheck = function (currentNo, base) {

    const digits = hugeIntCreatePowerArray(currentNo)
    return 1 + multiPer2(reduce(digits), base)
}

const multiPer2 = function (currentNo, base) {
    if (currentNo < base) return 0

    const digits = bigIntCreatePowerArray(currentNo, base)
    return 1 + multiPer2(reduce(digits), base)
}
