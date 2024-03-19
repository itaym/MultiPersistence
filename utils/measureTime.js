import { getTimeStringMilli } from './getTimeString.js'

function measureTime(fn) {

    let count = 0
    let duration = 0
    let endTime = 0
    let result = null
    let startTime = 0

    function callFn(...args) {
        count++
        startTime = performance.now()
        result = fn(...args)
        endTime = performance.now()
        duration += endTime - startTime
        return result
    }
    callFn.reset = function() {
        count = 0
        duration = 0
        endTime = 0
        result = null
        startTime = 0
    }
    callFn.stats = function(multiplyBy) {
        multiplyBy ??= 1
        let averageDuration = duration / count * multiplyBy
        return {
            averageDuration: averageDuration.toFixed(12),
            count: count.toLocaleString(),
            perSecond: (Math.round(1_000 / averageDuration)).toLocaleString(),
            totalDuration: getTimeStringMilli(duration),
        }
    }
    return callFn
}

export default measureTime