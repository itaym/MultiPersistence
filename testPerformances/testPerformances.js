import measureTime from './measureTime.js'
import { getTimeString } from '../utils/getTimeString.js'

let run, counter = 1

const serializeStats = stats => ({
    count: stats.count.toLocaleString(),
    perSecond: Math.round(stats.perSecond).toLocaleString(),
    percent: (stats.perSecond / stats.perSecond2 * 100 - 100).toFixed(4).padStart(8, ' ') + '%',
    totalDuration: getTimeString(stats.totalDuration, false),
})

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

const testPerformances = (
    { tests, getArgs },
    {
        multiplyBy = 1,
        numIterations = 1_000_000_001,
        showAfter = 1_000_000,
        warmupIterations = 1_000_000,
    }) => {

    const measureTimeFun = {}
    const measureTimeArg = {}

    for (let x = 0; x < tests.length; x++) {
        const fnKey = `fn_${x}`
        const arKey = `ar_${x}`
        measureTimeFun[fnKey] = measureTime(tests[x])
        measureTimeArg[arKey] = measureTime(getArgs[x])
    }

    for (let x = 0; x < warmupIterations; x++) {
        for (let y = 0; y < tests.length; y++) {
            const fnKey = `fn_${y}`
            const arKey = `ar_${y}`
            measureTimeFun[fnKey](measureTimeArg[arKey]())
        }
    }

    for (let x = 0; x < tests.length; x++) {
        const fnKey = `fn_${x}`
        const arKey = `ar_${x}`
        measureTimeFun[fnKey].reset()
        measureTimeArg[arKey].reset()
    }

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
