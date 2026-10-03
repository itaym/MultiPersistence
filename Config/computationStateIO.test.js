/** Tests for computationStateIO: default state fields and their `toJs` round-trip. */
import toJs from '#io/utils.js'
import assert from 'node:assert/strict'
import {
    rmSync,
    writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

process.normalizedEnv = {
    base: 6n,
    debug: true,
    last_number: 0n,
    pseudo_goal_number: 6n ** 499n,
    results_file: 'test',
}

const { getComputationState } = await import('./computationStateIO.js')

let passed = 0
let failed = 0

/**
 * Runs `fn`, counting and logging a failure.
 *
 * @param {() => Promise<void>} fn
 * @param {string} name
 * @returns {Promise<void>}
 */
const test = async (fn, name) => {
    try {
        await fn()
        passed++
    } catch (err) {
        failed++
        console.error(`✗ ${name}`)
        console.error(`  ${err.stack?.split('\n').slice(0, 3).join('\n  ') ?? err.message}`)
    }
}

await test(async () => {
    const state = await getComputationState()
    assert.equal(typeof state.pseudoGoal, 'bigint')
    assert.equal(state.pseudoGoal, 6n ** 499n)
}, 'defaultVars carries pseudoGoal as a BigInt')

await test(async () => {
    const state = await getComputationState()
    assert.equal(typeof state.range_start, 'bigint')
    assert.equal(state.range_start, 0n)
}, 'defaultVars carries range_start as 0n')

await test(async () => {
    const state = {
        base: 6n,
        iterations: {},
        number_lengths: {},
        pseudoGoal: 6n ** 12n,
        range_start: 222n,
        steps: [],
        up_time: 0,
    }
    const file = join(tmpdir(), `cs-round-trip-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`)
    writeFileSync(file, `export default ${toJs(state)}\n`)
    try {
        const back = (await import(pathToFileURL(file).href)).default
        assert.equal(typeof back.pseudoGoal, 'bigint')
        assert.equal(back.pseudoGoal, 6n ** 12n)
        assert.equal(typeof back.range_start, 'bigint')
        assert.equal(back.range_start, 222n)
    } finally {
        rmSync(file, { force: true })
    }
}, 'pseudoGoal / range_start survive a toJs round-trip')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
