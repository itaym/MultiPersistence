import memorize from '#utils/memorize.js'
import MultiMap from '#utils/MultiMap.js'

/**
 * Canonical numbers of exactly `length` digits whose values fit in `base` (1..base), cached by length.
 *
 * @type {(base: bigint, length: bigint) => bigint}
 */
const _getPermutations = (() => {
    const getPCache = new MultiMap()
    const getPCacheLast = new MultiMap()

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
 * Canonical numbers of 1..`length` digits whose values fit in `base`; disk-memorized.
 *
 * @type {(base: bigint, length: bigint) => bigint}
 */
const getPermutations = (() => {
    const cacheLast = new MultiMap()
    const cache = new MultiMap()

    return memorize((base, length) => {
        let baseLast = cacheLast.get(base)
        let checkLength = 1n
        let result = 0n

        if (!baseLast) baseLast = -1n
        const theLastOne = baseLast

        if (baseLast > length) {
            baseLast = length
        }

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
 * Canonical numbers of 1..`_length` digits over `base` digit values; `0n` for `_length <= 0n`; disk-memorized.
 *
 * @type {(_length: bigint, base: bigint) => bigint}
 */
const countPermutations = memorize((_length, base) => {
    if (_length <= 0n) return 0n

    return getPermutations(base, _length)
}, 'countPermutations')

export default countPermutations
