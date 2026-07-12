import { initConfig } from '../Config/config.js'

import memorize from '../utils/memorize.js'

initConfig();

let permutationsJson

/**
 * Internal recursive permutation counter.
 *
 * Computes the number of permutations of length `length` using digits in the
 * range `[1 … base]`. This function builds results incrementally and caches
 * partial sums to avoid recomputation.
 *
 * Behavior:
 *  - If length === 1 → return base
 *  - Otherwise recursively compute:
 *        Σ ( _getPermutations(runBase, length - 1) )
 *    for runBase from lastCachedBase+1 up to `base`.
 *
 * Caching:
 *  - `getPCache` stores partial sums keyed by "length,base".
 *  - `getPCacheLast` stores the highest base already computed for each length.
 *
 * @typedef {function} _getPermutations
 * @param {bigint} base
 *     Maximum digit value allowed in permutations.
 *
 * @param {bigint} length
 *     Length of the permutation sequence.
 *
 * @returns {bigint}
 *     Number of permutations for the given base and length.
 */
const _getPermutations = (() => {

    const getPCache = new Map()
    const getPCacheLast = new Map()

    /**
     * @param {bigint} base
     * @param {bigint} length
     */
    return (base, length) => {
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
    }
})()

/**
 * High‑level permutation counter.
 *
 * Computes the total number of permutations of lengths from 1 up to `length`,
 * using digits in the range `[1 … base]`. This wraps `_getPermutations` and
 * accumulates results across increasing lengths.
 *
 * Behavior:
 *  - Uses two caches:
 *      - `cache` stores partial sums keyed by "base,length".
 *      - `cacheLast` stores the highest length already computed for each base.
 *  - Only computes new lengths beyond the cached ones.
 *  - Memoized using `memorize()` to persist results to disk.
 *
 * @param {bigint} base
 *     Maximum digit value allowed in permutations.
 *
 * @param {bigint} length
 *     Maximum permutation length to include in the sum.
 *
 * @returns {bigint}
 *     Total number of permutations for lengths 1…length.
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
 * Count the number of permutations of length `_length` using digits in the
 * range `[1 … base]`.
 *
 * This is the public API used by the persistence engine. Internally it calls
 * `getPermutations(base, _length)` and memoizes the result. The memoization
 * layer persists results to disk using the custom BigInt‑safe JSON serializer.
 *
 * Behavior:
 *  - If `_length <= 0` → return 0.
 *  - Otherwise compute and return:
 *        getPermutations(base, _length)
 *  - Results are memoized and periodically saved to:
 *        ./caching/countPermutations.json
 *
 * @param {bigint} _length
 *     Length of the permutation sequence.
 *
 * @param {bigint} base
 *     Maximum digit value allowed in permutations.
 *
 * @returns {bigint}
 *     Number of permutations for the given length and base.
 */
const countPermutations = memorize((_length, base) => {
    if (_length <= 0n) return 0n

    permutationsJson = getPermutations(base, _length)

    if (permutationsJson) {
        return permutationsJson
    }
    // if (!permutationsJson[base]) permutationsJson[base] = {}


    ;(() => {
        const s = JSON.stringify(permutationsJson, (key, value) => {
            const name = value?.constructor?.name
            if (name === 'BigInt') {
                return value.toString()
            }
            return value
        }, '\t')
        // const fileHandler = fs.openSync('permutations/permutations.json', 'rs+')
        // fs.writeSync(fileHandler, s)
        // fs.closeSync(fileHandler)
    })()
    return permutationsJson //[base][_length]
}, 'countPermutations')

export default countPermutations
