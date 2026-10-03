/** Profiling harness: runs `addOneToSorted` + `multiPerNBC` in a tight loop and prints iterations/sec. */
import HugeIntEx from '#HugeIntEx/index.js'
import { multiPerNBC } from '#MultiplicativePersistence/multiplicativePersistence.js'

const BASE = BigInt(process.env.BASE || 9)
const NUMBASE = Number(BASE)
const ITERS = Number(process.env.ITERS || 3_000_000)

/**
 * Search-style digit cell.
 *
 * @returns {DigitCell}
 */
const searchCell = () => ({
    additionSum: 0n, changed: true, count: 1n, digit: 0n, multiplySum: 0n, next: null, prev: null,
})

// ~150 non-decreasing base-9 digits over [2,8]
const startStr = (process.env.START || '234567').repeat(25).split('').sort().join('')
const currentNo = new HugeIntEx(BASE, searchCell, 0n).fromString(BASE, startStr)

let found = 0
const t0 = performance.now()

for (let i = 0; i < ITERS; i++) {
    currentNo.addOneToSorted()
    const r = multiPerNBC(NUMBASE, currentNo)
    if (r.steps !== 2) found++
}

const ms = performance.now() - t0

console.log(
    `${ITERS.toLocaleString()} iters in ${ms.toFixed(0)} ms  ->  ${(ITERS / ms * 1000 | 0).toLocaleString()} iter/s`,
)
console.log(`length now ${currentNo.length}, found (steps!==2) ${found}`)
