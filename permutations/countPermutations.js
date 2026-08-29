import { initConfig } from '../Config/config.js'

import memorize from '../utils/memorize.js'

initConfig()

let permutationsJson

/**
 * Computes permutations of a given length using digits 1…base.
 *
 * Uses internal caching to avoid recomputation.
 *
 * @param {BigInt} base
 *     Maximum digit value.
 *
 * @param {BigInt} length
 *     Permutation length.
 *
 * @returns {BigInt}
 *     Number of permutations.
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
 * Computes total permutations for lengths 1…length using digits 1…base.
 *
 * Wraps `_getPermutations` and caches accumulated results.
 *
 * @param {BigInt} base
 *     Maximum digit value.
 *
 * @param {BigInt} length
 *     Maximum length to include.
 *
 * @returns {BigInt}
 *     Total permutations.
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
 * Counts permutations of a given length using digits 1…base.
 *
 * Returns 0 for non‑positive lengths; otherwise delegates to getPermutations.
 *
 * @param {BigInt} _length
 *     Permutation length.
 *
 * @param {BigInt} base
 *     Maximum digit value.
 *
 * @returns {BigInt}
 *     Number of permutations.
 */
const countPermutations = memorize((_length, base) => {
    if (_length <= 0n) return 0n

    permutationsJson = getPermutations(base, _length)
    return permutationsJson
}, 'countPermutations')

export default countPermutations
