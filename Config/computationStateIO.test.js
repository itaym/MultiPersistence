/**
 * Standalone tests for Config/computationStateIO.js.
 *
 *     node Config/computationStateIO.test.js
 */

import assert from 'node:assert/strict'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { toJs } from '#io/utils.js'

process.normalizedEnv = {
    base: 6n,
    debug: true,
    goal_number: 6n ** 499n,
    last_number: 0n,
    results_file: 'test',
}

const { getComputationState } = await import('./computationStateIO.js')

let passed = 0
let failed = 0

const test = async (name, fn) => {
    try {
        await fn()
        passed++
    } catch (err) {
        failed++
        console.error(`✗ ${name}`)
        console.error(`  ${err.stack?.split('\n').slice(0, 3).join('\n  ') ?? err.message}`)
    }
}

await test('defaultVars carries goal as a BigInt', async () => {
    const state = await getComputationState()
    assert.equal(typeof state.goal, 'bigint')
    assert.equal(state.goal, 6n ** 499n)
})

await test('defaultVars carries range_start as 0n', async () => {
    const state = await getComputationState()
    assert.equal(typeof state.range_start, 'bigint')
    assert.equal(state.range_start, 0n)
})

await test('goal / range_start survive a toJs round-trip', async () => {
    const state = {
        base: 6n, goal: 6n ** 12n, range_start: 222n,
        iterations: {}, number_lengths: {}, steps: [], up_time: 0,
    }
    const file = join(tmpdir(), `cs-roundtrip-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`)
    writeFileSync(file, `export default ${toJs(state)}\n`)
    try {
        const back = (await import(pathToFileURL(file).href)).default
        assert.equal(typeof back.goal, 'bigint')
        assert.equal(back.goal, 6n ** 12n)
        assert.equal(typeof back.range_start, 'bigint')
        assert.equal(back.range_start, 222n)
    }
    finally {
        rmSync(file, { force: true })
    }
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
