/**
 * The search's hot loop, isolated for profiling — `addOneToSorted` + `multiPerNBC`
 * on a realistic (~150 base-9 digit) starting number. No worker, no config, no
 * `baseAccommodate` (base-9 accommodate is a leading-digit switch, negligible).
 *
 *     node --cpu-prof --cpu-prof-dir=./_prof testPerformances/prof_hotloop.js
 *     # then: node testPerformances/prof_report.mjs ./_prof/<file>.cpuprofile
 *
 * ITERS / BASE / START overridable via env.
 */

import { HugeIntEx } from '#HugeIntEx/HugeIntEx.js'
import { multiPerNBC } from '#MultiplicativePersistence/multiplicativePersistence.js'

const BASE = BigInt(process.env.BASE || 9)
const NUMBASE = Number(BASE)
const ITERS = Number(process.env.ITERS || 3_000_000)

const searchCell = () => ({
    additionSum: 0n, changed: true, count: 1n, digit: 0n, multiplySum: 0n, next: null, prev: null,
})

// ~150 non-decreasing base-9 digits over [2,8]
const startStr = (process.env.START || '234567').repeat(25).split('').sort().join('')
const currentNo = new HugeIntEx(0n, BASE, searchCell).fromString(startStr, BASE)

let found = 0
const t0 = performance.now()
for (let i = 0; i < ITERS; i++) {
    currentNo.addOneToSorted()
    const r = multiPerNBC(currentNo, NUMBASE)
    if (r.steps !== 2) found++
}
const ms = performance.now() - t0

console.log(`${ITERS.toLocaleString()} iters in ${ms.toFixed(0)} ms  ->  ${(ITERS / ms * 1000 | 0).toLocaleString()} iter/s`)
console.log(`length now ${currentNo.length}, found (steps!==2) ${found}`)
