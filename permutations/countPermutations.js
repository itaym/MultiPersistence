import fs, { promises as fsPromises } from 'fs'
import memorize from '../utils/memorize.js'
import Cache from '../utils/Cache.js'

let data, permutationsJson

const _getPermutations = (() => {

    const getPCache = new Cache()
    const getPCacheLast = new Cache()

    return memorize((base, length) => {
        if (length === 1n) return base

        let baseLast = getPCacheLast.get(length)
        let checkBase = 1n
        let result =  0n

        if (!baseLast) baseLast = -1n
        const theLastOne = baseLast
        baseLast = BigInt(Math.min(Number(baseLast), Number(base)))

        if (baseLast > -1n) {
            checkBase = baseLast + 1n
            result = getPCache.get(`${length},${baseLast}`)
        }

        for (let runBase = checkBase; runBase <= base; runBase++) {
            result += _getPermutations(runBase, length - 1n)
            getPCache.set(`${length},${runBase}`, result)
            if (runBase > theLastOne) getPCacheLast.set(length, runBase)
        }
        return result
    }, '_getPermutations')
})()

const getPermutations = (() => {

    const cacheLast = new Map()
    const cache = new Map()

    return memorize((base, length) => {

        let baseLast = cacheLast.get(base)
        let checkLength = 1n
        let result = 0n

        if (!baseLast) baseLast = -1n
        const theLastOne = baseLast

        if (baseLast > length)
            baseLast = length
        //baseLast = BigInt(Math.min(Number(baseLast), Number(length)))

        if (baseLast > -1n) {
            checkLength = baseLast + 1n
            result = cache.get(`${base},${baseLast}`)
        }

        for (let runLength = checkLength; runLength <= length; runLength++) {
            result += _getPermutations(base, runLength)
            cache.set(`${base},${runLength}`, result)
            //console.log(cache.size)
            if (runLength > theLastOne) {
                cacheLast.set(base, runLength)
                //console.log(cacheLast.size)
            }
        }
        return result
    }, 'getPermutation')
})()

const countPermutations = (_length, base) => {
    if (_length <= 0n) return 0n
    if (permutationsJson[base] && permutationsJson[base][_length]) {
        return permutationsJson[base][_length]
    }
    if (!permutationsJson[base]) permutationsJson[base] = {}
    permutationsJson[base][_length] = getPermutations(base, _length)

    ;(() => {
        const s = JSON.stringify(permutationsJson, (key, value) => {
            const name = value?.constructor?.name
            if (name === 'BigInt') {
                return value.toString()
            }
            return value
        }, '\t')
        const fileHandler = fs.openSync('permutations/permutations.json', 'rs+')
        fs.writeSync(fileHandler, s)
        fs.closeSync(fileHandler)
    })()
    return permutationsJson[base][_length]
}

try {
    data = await fsPromises.readFile('permutations/permutations.json')
    permutationsJson = JSON.parse(data, (key, value) => {
        if (typeof value === 'string')
            return BigInt(value)
        return value
    }) || {}
}
catch (e) {
    permutationsJson = {}
}

export default countPermutations