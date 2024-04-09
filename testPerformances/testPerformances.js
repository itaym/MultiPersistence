import measureTime from '../utils/measureTime.js'
import { getTimeStringMilli } from '../utils/getTimeString.js'

let run, counter = 1

const serializeStats = stats => ({
    count: stats.count.toLocaleString(),
    perSecond: Math.round(stats.perSecond).toLocaleString(),
    percent: (stats.perSecond / stats.perSecond2 * 100 - 100).toFixed(4).padStart(8, ' ') + '%',
    totalDuration: getTimeStringMilli(stats.totalDuration),
})
const showStats = (fn1, fn2, arg1, arg2, multiplyBy) => {
    const fn1Stats = fn1.stats(multiplyBy)
    const fn2Stats = fn2.stats(multiplyBy)
    const arg1Stats = arg1.stats(1)
    const arg2Stats = arg2.stats(1)

    fn1Stats.perSecond2 = fn2Stats.perSecond
    fn2Stats.perSecond2 = fn1Stats.perSecond
    arg1Stats.perSecond2 = arg2Stats.perSecond
    arg2Stats.perSecond2 = arg1Stats.perSecond

    const results = {
        fn1: serializeStats(fn1Stats),
        fn2: serializeStats(fn2Stats),
        arg1: serializeStats(arg1Stats),
        arg2: serializeStats(arg2Stats),
    }
    console.table(results)
    return results
}

const testPerformances = (
    { test_1, test_2, getArgs_1, getArgs_2 },
    {
        multiplyBy = 1,
        numIterations = 1_000_000_001,
        showAfter = 1_000_000,
        warmupIterations = 1_000_000,
    }) => {

    const fn1 = measureTime(test_1)
    const fn2 = measureTime(test_2)
    const arg1 = measureTime(getArgs_1)
    const arg2 = measureTime(getArgs_2)

    run = {fn1: fn1, arg1: arg1, fn2: fn2, arg2: arg2,}

    for (let x = 0; x < warmupIterations; x++) {
        run.fn1(run.arg1())
        run.fn2(run.arg2())
    }
    run.fn1.reset()
    run.fn2.reset()
    run.arg1.reset()
    run.arg2.reset()

    for (; counter < numIterations; counter++) {

        run.fn1(run.arg1())
        run.fn2(run.arg2())

        if (counter % showAfter === 0) {
            showStats(fn1, fn2, arg1, arg2, multiplyBy)

            if (((counter / showAfter) % 2) === 0)
                run = {fn1: fn1, arg1: arg1, fn2: fn2, arg2: arg2,}
            else
                run = {fn1: fn2, arg1: arg2, fn2: fn1, arg2: arg1,}
        }
    }
    return showStats(fn1, fn2, arg1, arg2, multiplyBy)
}

export default testPerformances
