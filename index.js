/** config must be the first import. It initializes the environment variables */
import './Config/config.js'
/** ------------------------------------------------------------------------- */
import './utils/pollyfill.js'
/** ------------------------------------------------------------------------- */
import HugeInt from './HugeInt/index.js'
import { Worker, SHARE_ENV } from 'worker_threads'
import { getInitVars } from './Config/getInitVars.js'
import { multiplicativePersistenceSearch } from './MultiplicativePersistence/index.js'
import postMessage from './utils/postMessage.js'






// function reduce(a, b) { return a * b }
//
// function myReduce(arr, init) {
//     let result = init || arr[0]
//     for (let x = 1; x < arr.length; x++) {
//         result *= arr[x]
//     }
//     return result
// }
// function myMap(arr, fn) {
//     const result = [] // new Array(arr.length)
//     for (let x = 0; x < arr.length; x++) {
//         result.push(fn(arr[x]))
//     }
//     return result
// }
// function hugeIntMap({ count, digit }) { return digit ** count }
// let c1 = 0, c2 = 0
// for (let grandLoop = 0; grandLoop < 1_000; grandLoop++) {
//     const size = Math.round(Math.random() * 10) + 1
//     let digit = 2n
//     const arr = new Array(size).fill(0).map(_ => {
//         const cell = {
//             digit,
//             count: BigInt(Math.round(Math.random() * 320))
//         }
//         digit++
//         if (digit === 10n) digit = 2n
//         return cell
//     })
//
//     let loopSize = 4_000
//     let st1, et1
//     st1 = Date.now()
//     for (let x = 0; x < loopSize; x++) {
//         arr.map(hugeIntMap)
//     }
//     et1 = Date.now()
//     c1 += et1 - st1
//
//     let st2, et2
//     st2 = Date.now()
//     for (let x = 0; x < loopSize; x++) {
//         myMap(arr, hugeIntMap)
//     }
//     et2 = Date.now()
//     c2 += et2 - st2
//
// }
// for (let grandLoop = 0; grandLoop < 1_000; grandLoop++) {
//     const size = Math.round(Math.random() * 1_000) + 1
//     const arr = new Array(size).fill(1) //.map(_ => BigInt(Math.round(Math.random() * 10)))
//
//     let loopSize = 10_00
//     let st1, et1
//     st1 = Date.now()
//     for (let x = 0; x < loopSize; x++) {
//         arr.reduce(reduce)
//     }
//     et1 = Date.now()
//     c1 += et1 - st1
//
//     let st2, et2
//     st2 = Date.now()
//     for (let x = 0; x < loopSize; x++) {
//         myReduce(arr)
//     }
//     et2 = Date.now()
//     c2 += et2 - st2
//
// }
// console.table({ c1, c2})
//
// process.abort()


const { env, selfEnv } = process

env.isWorkerReady = 'false'
env.log = ''

// noinspection JSCheckFunctionSignatures
const worker = new Worker('./worker.js', {
    'env': SHARE_ENV,
    resourceLimits: {
        maxOldGenerationSizeMb: 32_768
    },
})

let initVars = await getInitVars()

let goalNumber = new HugeInt(selfEnv.goal_number, selfEnv.base)
postMessage( worker, 'init', {
    VARS: {
        ...initVars,
    },
    base:  selfEnv.base,
    goalNumber: goalNumber.value,
})

// noinspection JSCheckFunctionSignatures
await multiplicativePersistenceSearch(initVars, worker)
worker.terminate()