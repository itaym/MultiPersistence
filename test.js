/** Runs every `*.test.js` file in its own process and exits non-zero if any fail. */
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * All `*.test.js` paths under `dir`, sorted, skipping `node_modules`.
 *
 * @param {string} dir
 * @returns {string[]}
 */
const findTestFiles = dir =>
    readdirSync(dir, { encoding: 'utf8', recursive: true })
        .filter(name => name.endsWith('.test.js') && !name.split(/[\\/]/).includes('node_modules'))
        .map(name => join(dir, name))
        .sort()

const testFiles = findTestFiles('.')
let failedCount = 0

for (const file of testFiles) {
    console.log(`\n--- ${file} ---`)
    const result = spawnSync('node', [file], { stdio: 'inherit' })
    if (result.status !== 0) failedCount++
}

console.log(`\n${testFiles.length - failedCount}/${testFiles.length} test files passed`)
process.exit(failedCount ? 1 : 0)
