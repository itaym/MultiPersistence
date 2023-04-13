import Cache from './Cache.js'

/**
 *
 * @param fn
 * @return {function(...[*])}
 */
export default function memorize(fn) {
    const cache = new Cache({expireIn: 30_000, maxSize: 1_000_000})

    return function (...args) {
        const key = args.join()

        return cache.get(key) || (() => {
            const data = fn(...args)
            cache.set(key, data)
            return data
        })()
    }
}

/**
 *
 * @param fn
 * @return {function(...[*]): (bigint|*)}
 */
export const  memorizeForPowerBy = (fn) => {
    const cache = new Cache({expireIn: 30_000, maxSize: 1_000_000})
    return function (...args) {
        if (args[0] === 1n) return 1n
        const key = args.join()

        return cache.get(key) || (() => {
            const data = fn(...args)
            cache.set(key, data)
            return data
        })()
    }
}

export const memorizeSortedKey = (fn) => {
    const cache = new Cache({expireIn: 30_000, maxSize: 1_000_000})

    return function (...args) {
        const key = args.flat().sort().join()

        return cache.get(key) || (() => {
            const data = fn(...args)
            cache.set(key, data)
            return data
        })()
    }
}