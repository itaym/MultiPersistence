function measureTime(fn) {

    let count = 0
    let totalDuration = 0
    let endTime = 0
    let result = null
    let startTime = 0

    function callFn(...args) {
        count++
        startTime = performance.now()
        result = fn(...args)
        endTime = performance.now()
        totalDuration += endTime - startTime
        return result
    }
    callFn.reset = function() {
        count = 0
        totalDuration = 0
        endTime = 0
        result = null
        startTime = 0
    }
    callFn.stats = function(multiplyBy) {
        multiplyBy ??= 1
        let averageDuration = totalDuration / count * multiplyBy
        return {
            averageDuration,
            count,
            perSecond: 1_000 / averageDuration,
            totalDuration: totalDuration,
        }
    }
    return callFn
}

export default measureTime