import { digitsValue } from './Digits/index.js'
const  tbi = new Array(1_0)
for (let int = 0; int < 1_0; int++) {
    tbi[int] = BigInt(int)
}
const fn1 = (str) => {
    return str.includes('0')
}
const fn2 = (str) => {
    str.substring(0, str.length/2).includes('0')
}

let grandLoopSize = BigInt(Number.MAX_SAFE_INTEGER)
let loopSize = 1n
let testNum = 1n
let testStr = ''
let radix = 10
let c1 = 0, c2 = 0, c3 = 0
let st1, et1
st1 = Date.now()
for (let grandLoop = 1n; grandLoop < grandLoopSize; grandLoop++) {
    testNum *= grandLoop
    testStr = testNum.toString(radix)
    //console.log(testStr.length)
    // radix++
    // if (radix > 36) radix = 3

    // let a = 0n
    // let st1, et1
    // st1 = Date.now()
    // for (let x = 0n; x < loopSize; x++) {
    //     //a = fn1(testStr)
    // }
    // et1 = Date.now()
    // c1 += et1 - st1
    //
    // let b = 0n
    // let st2, et2
    // st2 = Date.now()
    // for (let x = 0n; x < loopSize; x++) {
    //     //b = fn2(testStr)
    // }
    // et2 = Date.now()
    // c2 += et2 - st2
    let length = testStr.length
    if (length > c2)
        c2 = length

    c3 += length
    // let c = 0n
    // let st3, et3
    // st3 = Date.now()
    // for (let x = 0n; x < loopSize; x++) {
    //     c = convertToPowerArray(testStr.replaceAll('1', ''))
    // }
    // et3 = Date.now()
    // c3 += et3 - st3
    testStr = testStr.replaceAll('0', '')
    testNum = BigInt(testStr)
    if(grandLoop % 1_000_000n === 0n) {
        let et2 = Date.now()
        let cc1 = et2 - st1
        cc1 = Math.round(1_000 / (cc1 / Number(grandLoop))).toLocaleString()
        let cc3 = Number(c3 / Number(grandLoop)).toFixed(4)
        console.table({ percent: Number(Number(grandLoop)/Number(grandLoopSize) * 100).toFixed(4), grandLoop: grandLoop.toLocaleString(), cc1, c2, cc3})
    }
}
et1 = Date.now()
c1 += et1 - st1
 c1 = Math.round(1_000 / (c1 / Number(grandLoopSize))).toLocaleString()
// c2 = Math.round(1_000 / (c2 / Number(grandLoopSize * loopSize))).toLocaleString()
c3 /= Number(grandLoopSize)
//c3 = Math.round(1_000 / (c3 / Number(grandLoopSize * loopSize))).toLocaleString()
console.table({ c1, c2, c3})

//process.abort()