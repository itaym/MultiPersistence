function measureTime(fn) {

    let count = 0
    let duration = 0
    let endTime = 0
    let result = null
    let startTime = 0

    function callFn(...args) {
        count++
        startTime = Date.now()
        result = fn(...args)
        endTime = Date.now()
        duration += endTime - startTime
        return result
    }
    callFn.stats = function(multiplyBy) {
        multiplyBy ??= 1
        return {
            totalDuration: duration,
            count,
            averageDuration: duration / count * multiplyBy
        }
    }
    return callFn
}

export default measureTime