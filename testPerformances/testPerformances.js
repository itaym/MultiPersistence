import measureTime from './measureTime.js'
import { getTimeString } from '../utils/getTimeString.js'

/**
 * @typedef {import('./measureTime.js').AnyFn} AnyFn
 * @typedef {import('./measureTime.js').MeasuredFn} MeasuredFn
 * @typedef {import('./measureTime.js').TimingStats} TimingStats
 */

/**
 * A `TimingStats` snapshot with the baseline throughput to compare against
 * spliced in by {@link showStats} (here: the mean `perSecond` of the group).
 *
 * @typedef {TimingStats & { perSecond2: number }} ComparedStats
 */

/**
 * One row of the printed `console.table`, all fields pre-formatted as strings.
 *
 * @typedef {Object} StatsRow
 * @property {string} count          call count, locale-formatted
 * @property {string} perSecond      throughput, rounded and locale-formatted
 * @property {string} percent        signed % gap vs the baseline, 4dp, padded
 * @property {string} totalDuration  accumulated time, humanized
 */

/**
 * @typedef {Object} BenchSpec
 * @property {AnyFn[]} tests    functions to benchmark
 * @property {AnyFn[]} getArgs  arg producers, paired by index — `getArgs[i]()`
 *                              feeds `tests[i]` on every iteration
 */

/**
 * @typedef {Object} BenchOptions
 * @property {number} [multiplyBy=1]                  passed to `.stats()`, scales the per-call figures
 * @property {number} [numIterations=1_000_000_001]   measured iterations (upper bound on `counter`)
 * @property {number} [showAfter=1_000_000]           print a table every N iterations
 * @property {number} [warmupIterations=1_000_000]    unmeasured iterations run before the counters reset
 */

// `counter` is module-global so it isn't reset between successive runs in one process.
// `run` is currently unused — leftover from the old pairwise implementation.
let run, counter = 1

/**
 * Formats one stats object into a printable {@link StatsRow}.
 *
 * @param {ComparedStats} stats  stats plus a `perSecond2` baseline for `percent`
 * @returns {StatsRow}
 */
const serializeStats = stats => ({
    count: stats.count.toLocaleString(),
    perSecond: Math.round(stats.perSecond).toLocaleString(),
    percent: (stats.perSecond / stats.perSecond2 * 100 - 100).toFixed(4).padStart(8, ' ') + '%',
    totalDuration: getTimeString(stats.totalDuration, false),
})

/**
 * Reads `.stats()` off every measured function and arg producer, uses each
 * group's mean throughput as the comparison baseline, prints the table, and
 * returns it.
 *
 * @param {MeasuredFn[]} tests         measured benchmark functions
 * @param {MeasuredFn[]} args          measured arg producers, index-paired with `tests`
 * @param {number} [multiplyBy=1]      forwarded to `.stats()`
 * @returns {Object<string, StatsRow>} keyed `fn_0`, `ar_0`, `fn_1`, … — as handed to `console.table`
 */
const showStats = (tests, args, multiplyBy) => {

    const funStats = {}
    const argStats = {}
    let funAverage = 0
    let argAverage = 0


    for (let x = 0; x < tests.length; x++) {
        const fnKey = `fn_${x}`
        const arKey = `ar_${x}`
        funStats[fnKey] = tests[x].stats(multiplyBy)
        argStats[arKey] = args[x].stats(multiplyBy)

        funAverage += funStats[fnKey].perSecond
        argAverage += argStats[arKey].perSecond
    }

    funAverage /= tests.length
    argAverage /= args.length

    const results = {}

    for (let x = 0; x < tests.length; x++) {
        const fnKey = `fn_${x}`
        const arKey = `ar_${x}`
        funStats[fnKey].perSecond2 = funAverage
        argStats[arKey].perSecond2 = argAverage

        results[fnKey] = serializeStats(funStats[fnKey])
        results[arKey] = serializeStats(argStats[arKey])
    }

    console.table(results)
    return results
}

/**
 * Runs every function in `tests` side by side over the same iteration loop and
 * reports their relative throughput.
 *
 * Each iteration calls `tests[i](getArgs[i]())` for all `i`. After a warm-up
 * phase the timers are reset, then the measured loop runs, printing a table
 * every `showAfter` iterations and once more at the end. The `percent` column
 * shows how each function compares to the mean of the group.
 *
 * @param {BenchSpec} spec             functions to benchmark and their paired arg producers
 * @param {BenchOptions} [options]     iteration counts and reporting cadence
 * @returns {Object<string, StatsRow>} the final stats table (see {@link showStats})
 */
const testPerformances = (
    { tests, getArgs },
    {
        multiplyBy = 1,
        numIterations = 1_000_000_001,
        showAfter = 1_000_000,
        warmupIterations = 1_000_000,
    }) => {

    // fn_<i> / ar_<i> -> measured wrappers, index-paired with tests / getArgs
    const measureTimeFun = {}
    const measureTimeArg = {}

    for (let x = 0; x < tests.length; x++) {
        const fnKey = `fn_${x}`
        const arKey = `ar_${x}`
        measureTimeFun[fnKey] = measureTime(tests[x])
        measureTimeArg[arKey] = measureTime(getArgs[x])
    }

    // Warm-up: let the JIT specialize each function before anything is measured.
    for (let x = 0; x < warmupIterations; x++) {
        for (let y = 0; y < tests.length; y++) {
            const fnKey = `fn_${y}`
            const arKey = `ar_${y}`
            measureTimeFun[fnKey](measureTimeArg[arKey]())
        }
    }

    // Drop the warm-up timings; only what follows counts.
    for (let x = 0; x < tests.length; x++) {
        const fnKey = `fn_${x}`
        const arKey = `ar_${x}`
        measureTimeFun[fnKey].reset()
        measureTimeArg[arKey].reset()
    }

    // Measured loop: round-robin every function once per iteration.
    for (; counter < numIterations; counter++) {

        for (let x = 0; x < tests.length; x++) {
            const fnKey = `fn_${x}`
            const arKey = `ar_${x}`
            measureTimeFun[fnKey](measureTimeArg[arKey]())
        }

        if (counter % showAfter === 0) {
            showStats(Object.values(measureTimeFun),Object.values(measureTimeArg), multiplyBy)
        }
    }
    return showStats(Object.values(measureTimeFun),Object.values(measureTimeArg), multiplyBy)
}
export default testPerformances
