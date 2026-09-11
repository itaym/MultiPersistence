import memorize from '#utils/memorize.js'

/**
 * Permutations of length `length` over digits 1…base. Internally cached.
 *
 * @param {BigInt} base max digit value
 * @param {BigInt} length permutation length
 * @returns {BigInt}
 */
const _getPermutations = (() => {

    const getPCache = new Map()
    const getPCacheLast = new Map()

    return (base, length) => {
        if (length === 1n) return base

        let baseLast = getPCacheLast.get(length)
        let checkBase = 1n
        let result = 0n

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
    }
})()

/**
 * Total permutations for lengths 1…length over digits 1…base. Cached.
 *
 * @param {BigInt} base max digit value
 * @param {BigInt} length max length to include
 * @returns {BigInt}
 */
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

        if (baseLast > -1n) {
            checkLength = baseLast + 1n
            result = cache.get(`${base},${baseLast}`)
        }

        for (let runLength = checkLength; runLength <= length; runLength++) {
            result += _getPermutations(base, runLength)
            cache.set(`${base},${runLength}`, result)

            if (runLength > theLastOne) {
                cacheLast.set(base, runLength)
            }
        }
        return result
    }, 'getPermutation')
})()

/**
 * Permutations of length `_length` over digits 1…base; `0n` for non-positive lengths.
 *
 * @param {BigInt} _length permutation length
 * @param {BigInt} base max digit value
 * @returns {BigInt}
 */
const countPermutations = memorize((_length, base) => {
    if (_length <= 0n) return 0n

    return getPermutations(base, _length)
}, 'countPermutations')

export default countPermutations
