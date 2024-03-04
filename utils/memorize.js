import fs, { promises as fsPromises } from 'fs'
import path from 'path'
const count = {}

const replacer = (key, value) => {
    const name = value?.constructor?.name
    if (name === 'BigInt') {
        return value.toString()
    }
    return value
}
const reviver = () => {
    let toggle = 0
    return (key, value) => {
        toggle++
        if (toggle === 2) {
            toggle = -1
            return BigInt(value)
        }
        return value
    }
}

function saveMapToFile(filename, map) {
    const data = JSON.stringify(Array.from(map.entries()), replacer, '\t')
    try { fs.writeFileSync(filename, data) }
    catch {}
}

function loadMapFromFileSync(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8')
        const entries = JSON.parse(data, reviver()).sort((a , b) => {
            if (a[0] > b[0]) return 1
            if (a[0] < b[0]) return -1
            return 0
        })
        const map = new Map(entries)
        saveMapToFile(filename, map)
        return map
    }
    catch (e) {
        return new Map()
    }
}

export default function memorize(fn, name) {
    const fileName = `${path.normalize(path.resolve('./caching'))}/${name}.json`
    const cache = loadMapFromFileSync(fileName)
    let setCounter = 0

    return function (...args) {
        const key = args.join()
        let data = cache.get(key)
        if (data) return data
        data = fn(...args)
        cache.set(key, data)
        setCounter++
        if (!(setCounter % 100))
            saveMapToFile(fileName, cache)
        return data
    }
}

export const  memorizeForPowerBy = (name) => {
    const fileName = `${path.normalize(path.resolve('./caching'))}/${name}.json`
    const cache = loadMapFromFileSync(fileName)
    let setCounter = 0

    return function (a, b) {
        if (b === 1n) return a
        const key = a + ',' + b

        let data = cache.get(key)
        if (data) return data
        data = a ** b
        cache.set(key, data)
        setCounter++
        if (!(setCounter % 100))
            saveMapToFile(fileName, cache)
        return data
    }
}

export const memorizeSortedKey = (fn, name) => {
    const cache = new Map()

    return function (args = [1n]) {
        const key = args.sort().join()

        let data = cache.get(key)
        if (data) return data
        data = fn(...args)
        cache.set(key, data)
        console.log(cache.size, key)
        return data
        // return cache.get(key) || (() => {
        //     const data = fn(...args)
        //     cache.set(key, data)
        //     return data
        // })()
    }
}