import { digitsValue } from '../Digits/index.js'
import { memorizeForPowerBy } from '../utils/memorize.js'

const powerBy = memorizeForPowerBy((a, b) => a ** b, 'powerBy')

const convertToPowerArray = (() => {
    const splitRegEx = /((.)\2*)/g
    const  tbi = []
    for (let int = 0; int < 501; int++) {
        tbi.push(BigInt(int))
    }
    return (str) => {
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
const bigIntCreatePowerArray = (currentNo, base) => {
    let currentNoStr = currentNo.toString(base)
    if (currentNoStr.includes('0')) return arrayWithZero

    currentNoStr = currentNoStr.replace(replace1RegEx, '')

    return convertToPowerArray(currentNoStr)
}

const hugeIntMap = ({ count, digit }) => powerBy(digit ,count)

const hugeIntCreatePowerArray = hugeInt =>
    hugeInt.cellsArr.map(hugeIntMap)

const reduce = (a, b) => a * b

export const multiPer = function (currentNo, base) {
    if (currentNo.isLTBase()) return 0

    return multiPerNoBaseCheck(currentNo, base)
}
export const multiPerNoBaseCheck = function (currentNo, base) {

    const digits = hugeIntCreatePowerArray(currentNo)
    return 1 + multiPer2(digits.reduce(reduce), base)
}

const multiPer2 = function (currentNo, base) {
    if (currentNo < base) return 0

    const digits = bigIntCreatePowerArray(currentNo, base)
    return 1 + multiPer2(digits.reduce(reduce), base)
}
