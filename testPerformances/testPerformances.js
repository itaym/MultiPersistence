import getTimeString from '#utils/getTimeString.js'
import measureTime from './measureTime.js'

// `counter` is module-global so it isn't reset between successive runs in one process.
/** @type {number} iteration counter, kept across runs in one process */
let counter = 1

/**
 * Display row of one function's stats.
 *
 * @param {ComparedStats} stats
 * @returns {StatsRow}
 */
const serializeStats = stats => ({
    count: stats.count.toLocaleString(),
    percent: (stats.perSecond / stats.perSecond2 * 100 - 100).toFixed(4).padStart(8, ' ') + '%',
    perSecond: Math.round(stats.perSecond).toLocaleString(),
    totalDuration: getTimeString(stats.totalDuration, false),
})

/**
 * Prints and returns the stats table of all tests and arg getters.
 *
 * @param {MeasuredFn[]} args measured arg getters
 * @param {number} multiplyBy
 * @param {MeasuredFn[]} tests measured functions
 * @returns {Object<string, StatsRow>}
 */
const showStats = (args, multiplyBy, tests) => {
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
 * Benchmarks each test against the others, round-robin, printing stats every `showAfter` iterations.
 *
 * @param {BenchOptions} options
 * @param {BenchSpec} spec
 * @returns {Object<string, StatsRow>} final stats
 */
const testPerformances = (
    {
        multiplyBy = 1,
        numIterations = 1_000_000_001,
        showAfter = 1_000_000,
        warmupIterations = 1_000_000,
    }, { getArgs, tests }) => {
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
            showStats(Object.values(measureTimeArg), multiplyBy, Object.values(measureTimeFun))
        }
    }
    return showStats(Object.values(measureTimeArg), multiplyBy, Object.values(measureTimeFun))
}

export default testPerformances
