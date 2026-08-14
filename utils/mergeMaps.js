
import { initConfig } from '../Config/config.js'
import { initPollyFill } from '../utils/pollyfill.js'
import path from "path";
import { loadMapFromFileSync, saveMapToFile } from "./memorize.js";

initConfig({ path: '../.env' })
initPollyFill()

/**
 * Merges multiple Map instances into a single Map.
 * Later maps overwrite keys from earlier ones.
 *
 * @param {Map<string, any>[]} maps - Array of Map objects to merge
 * @returns {Map<string, any>} A new Map containing all merged entries
 */
const mergeMaps = (maps) => {
    console.log(`🔄 Starting merge of ${maps.length} maps...`);

    const resultMap = new Map();

    for (let i = 0; i < maps.length; i++) {
        const map = maps[i];
        console.log(`  ➕ Merging map #${i + 1} with ${map.size} entries`);

        for (const [key, value] of map) {
            resultMap.set(key, value);
        }
    }

    console.log(`✅ Merge complete. Total keys: ${resultMap.size}`);
    return resultMap;
};

/**
 * Normalizes a filename into an absolute JSON path inside the /caching directory.
 *
 * @param {string} filename - Filename without extension
 * @returns {string} Absolute normalized path to the JSON file
 */
const normalizeFilename = (filename) => {
    const fullPath = path.join(path.resolve("../caching"), `${filename}.json`);
    console.log(`📁 Normalized filename: ${fullPath}`);
    return fullPath;
};

/**
 * Loads multiple maps from disk, merges them, and saves the result.
 * Filenames must be edited manually in the array below.
 *
 * Throws if any file does not exist or cannot be parsed.
 */
export const runMergeMap = () => {
    console.log("🚀 Running merge process...");

    const bundle = [
        [
            "calcCellsArrFactorial",
            "calcCellsArrFactorial1",
            "calcCellsArrFactorial2"],

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
        const mapsArray = [];

        console.log(`📄 Preparing to load ${filenames.length} map files...`);

        for (let filename of filenames) {
            const normalizedFilename = normalizeFilename(filename);

            console.log(`📥 Loading map from: ${normalizedFilename}`);
            const map = loadMapFromFileSync(normalizedFilename);

            console.log(`   ✔ Loaded map with ${map.size} entries`);
            mapsArray.push(map);
        }

        const joinedMap = mergeMaps(mapsArray);

        const joinedMapsFilename = normalizeFilename(`${filenames[0]}_joined`);
        console.log(`💾 Saving merged map to: ${joinedMapsFilename}`);

        saveMapToFile(joinedMapsFilename, joinedMap);

        console.log("🎉 Merge process completed successfully!");
    }
};

runMergeMap()


