/**
 * Runs every `*.test.js` file in the project as its own process, reporting all of them —
 * a failure doesn't stop the rest from running.
 *
 *     node test.js
 */

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { readdirSync } from 'node:fs'

/**
 * Recursively finds every `*.test.js` file under `dir`, skipping `node_modules`.
 *
 * @param {string} dir
 * @returns {string[]}
 */
const findTestFiles = (dir) =>
    readdirSync(dir, { recursive: true })
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
