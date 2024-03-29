import measureTime from './utils/measureTime.js'
import { getTimeStringMilli } from './utils/getTimeString.js'
import { test_1, test_2, getArgs_1, getArgs_2 } from './testPerformancesFunctions.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
const warmupIterations = 10_000_000

let run, counter = 1

const serializeStats = stats => ({
    count: stats.count.toLocaleString(),
    perSecond: Math.round(stats.perSecond).toLocaleString(),
    percent: (stats.perSecond / stats.perSecond2 * 100 - 100).toFixed(4).padStart(8, ' ') + '%',
    totalDuration: getTimeStringMilli(stats.totalDuration),
})
const showStats = (fn1, fn2, multiplyBy) => {
    const fn1Stats = fn1.stats(multiplyBy)
    const fn2Stats = fn2.stats(multiplyBy)
    fn1Stats.perSecond2 = fn2Stats.perSecond
    fn2Stats.perSecond2 = fn1Stats.perSecond

    console.table({ fn1: serializeStats(fn1Stats), fn2: serializeStats(fn2Stats) })
}

const fn1 = measureTime(test_1)
const fn2 = measureTime(test_2)

run = { fn1: fn1, getArgs_1: getArgs_1, fn2: fn2, getArgs_2: getArgs_2, }

for (let x = 0; x < warmupIterations; x++) {
    run.fn1(run.getArgs_1())
    run.fn2(run.getArgs_2())
}
run.fn1.reset()
run.fn2.reset()

for (; counter < numIterations; counter++) {

    run.fn1(run.getArgs_1())
    run.fn2(run.getArgs_2())

    if (counter % showAfter === 0) {
        showStats(fn1, fn2, multiplyBy)

        if (((counter / showAfter) % 2) === 0)
            run = { fn1: fn1, getArgs_1: getArgs_1, fn2: fn2, getArgs_2: getArgs_2, }
        else
            run = { fn2: fn1, getArgs_2: getArgs_1, fn1: fn2, getArgs_1: getArgs_2, }
    }
}
