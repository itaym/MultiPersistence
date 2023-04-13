const profiler = require('profiler');
const profile = profiler.startProfiling('myapp');
profile.export(function (error, result) {
    console.log(result);
    profile.delete();
});