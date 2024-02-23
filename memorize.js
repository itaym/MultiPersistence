import Cache from './Cache.js'
const count = {}
/**
 *
 * @param fn
 * @param name
 * @return {function(...[*])}
 */
export default function memorize(fn, name) {
    const cache = new Cache({expireIn: 30_000, maxSize: 1_000_000}, name)
    count[name] = [0,0]
    //const cArr = count[name]
    return function (...args) {
        const key = args.join()
        //cArr[0]++
        return cache.get(key) || (() => {
            const data = fn(...args)
            //cArr[1]++
            cache.set(key, data)
            //console.log(name, cArr, args)
            return data
        })()
    }
}

/**
 *
 * @param fn
 * @param name
 * @return {function(...[*]): (bigint|*)}
 */
export const  memorizeForPowerBy = (fn, name) => {
    const cache = new Cache({expireIn: 30_000, maxSize: 1_000_000}, name)

    return function (a, b) {
        if (b === 1n) return a
        const key = a + ',' + b

        return cache.get(key) || (() => {
            const data = fn(a, b)
            cache.set(key, data)
            return data
        })()
    }
}

export const memorizeSortedKey = (fn) => {
    const cache = new Cache({expireIn: 30_000, maxSize: 1_000_000})

    return function (args = [1n]) {
        const key = args.sort().join()

        return cache.get(key) || (() => {
            const data = fn(...args)
            //console.log(cache.size)
            cache.set(key, data)
            return data
        })()
    }
}