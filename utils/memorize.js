import fs from 'fs'
import path from 'path'

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
let saveToFile = 100
export default function memorize(fn, name) {
    if (name === '_getPermutations') saveToFile = 10_000
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
        if (!(setCounter % saveToFile))
            saveMapToFile(fileName, cache)
        return data
    }
}
