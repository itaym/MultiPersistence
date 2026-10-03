/** Starts a CPU profile and prints it on export. */
const profiler = require('profiler')

const profile = profiler.startProfiling('myapp')

// eslint-disable-next-line n/handle-callback-err
profile.export((error, result) => {
    // eslint-disable-next-line no-console
    console.log(result)
    profile.delete()
})
