
import { initConfig } from '../Config/config.js'
import { initPollyFill } from '../utils/pollyfill.js'
import path from 'path'
import { loadMapFromFileSync, saveMapToFile } from './memorize.js'

initConfig({ path: '../.env' })
initPollyFill()

/**
 * Merges maps into a new one; later maps overwrite earlier keys.
 *
 * @param {Map<string, any>[]} maps
 * @returns {Map<string, any>}
 */
const mergeMaps = (maps) => {
    console.log(`🔄 Starting merge of ${maps.length} maps...`)

    const resultMap = new Map()

    for (let i = 0; i < maps.length; i++) {
        const map = maps[i]
        console.log(`  ➕ Merging map #${i + 1} with ${map.size} entries`)

        for (const [key, value] of map) {
            resultMap.set(key, value)
        }
    }

    console.log(`✅ Merge complete. Total keys: ${resultMap.size}`)
    return resultMap
}

/**
 * Absolute JSON path in the cache dir. Joined onto `../` since this file runs from `utils/`.
 *
 * @param {string} filename without extension
 * @returns {string}
 */
const normalizeFilename = (filename) => {
    const { normalizedEnv: { memorize_cache_dir } } = process
    const fullPath = path.join(path.resolve('../', memorize_cache_dir), `${filename}.json`)
    console.log(`📁 Normalized filename: ${fullPath}`)
    return fullPath
}

/**
 * Loads each bundle of maps from disk, merges it, and saves the result. Throws on a missing
 * or unparseable file. Filenames are edited by hand in the array below.
 */
export const runMergeMap = () => {
    console.log('🚀 Running merge process...')

    const bundle = [
        [
            'calcCellsArrFactorial',
            'calcCellsArrFactorial1',
            'calcCellsArrFactorial2'],

        [
            "countPermutations",
            "countPermutations1",
            "countPermutations2"],
        [
            "factorial",
            "factorial1",
            "factorial2"],

        [
            "getPermutation",
            "getPermutation1",
            "getPermutation2"],

        [
            "getPermutations",
            "getPermutations1",
            "getPermutations2"]
    ]

    for (let filenames of bundle) {
        const mapsArray = []

        console.log(`📄 Preparing to load ${filenames.length} map files...`)

        for (let filename of filenames) {
            const normalizedFilename = normalizeFilename(filename)

            console.log(`📥 Loading map from: ${normalizedFilename}`)
            const map = loadMapFromFileSync(normalizedFilename)

            console.log(`   ✔ Loaded map with ${map.size} entries`)
            mapsArray.push(map)
        }

        const joinedMap = mergeMaps(mapsArray)

        const joinedMapsFilename = normalizeFilename(`${filenames[0]}_joined`)
        console.log(`💾 Saving merged map to: ${joinedMapsFilename}`)

        saveMapToFile(joinedMapsFilename, joinedMap)

        console.log("🎉 Merge process completed successfully!")
    }
}

runMergeMap()


