/**
 * Summarize a V8 `.cpuprofile` (from `node --cpu-prof`): self-time per function,
 * hottest first.
 *
 *     node testPerformances/prof_report.mjs ./_prof/<file>.cpuprofile
 */
import { readFileSync } from 'fs'

const path = process.argv[2]
if (!path) { console.error('usage: node prof_report.mjs <file.cpuprofile>'); process.exit(1) }

const prof = JSON.parse(readFileSync(path, 'utf8'))
const byId = new Map(prof.nodes.map((n) => [n.id, n]))

// self time (samples) per node id
const selfSamples = new Map()
for (const id of prof.samples) selfSamples.set(id, (selfSamples.get(id) || 0) + 1)

const dt = (prof.timeDeltas.reduce((a, b) => a + b, 0) / prof.samples.length) || 1000 // us/sample

const rows = new Map()
for (const [id, count] of selfSamples) {
    const n = byId.get(id)
    if (!n) continue
    const cf = n.callFrame
    const key = `${cf.functionName || '(anon)'}  ${cf.url.split('/').slice(-1)[0]}:${cf.lineNumber + 1}`
    const r = rows.get(key) || { self: 0 }
    r.self += count
    rows.set(key, r)
}

const total = prof.samples.length
const sorted = [...rows.entries()].sort((a, b) => b[1].self - a[1].self)

console.log(`${total} samples, ~${(dt / 1000).toFixed(2)} ms/sample\n`)
console.log('self%    ms      function')
console.log('-----    ----    --------')
for (const [key, r] of sorted.slice(0, 25)) {
    const pct = (r.self / total * 100).toFixed(1).padStart(5)
    const ms = (r.self * dt / 1000).toFixed(0).padStart(6)
    console.log(`${pct}  ${ms}    ${key}`)
}
