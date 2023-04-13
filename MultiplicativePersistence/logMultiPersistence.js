import getTimeString from '../getTimeString.js'
import countPermutations from '../countPermutations.js'

export const fromMiddleStringMaxLength= (str, max = Number.MAX_SAFE_INTEGER) => {
    if (str.length > max) {
        const str1 = str.substr(0, Math.floor(max / 2) - 3 + (max % 2 ? 1 : 0))
        const str2 = str.substr(str.length -Math.floor(max / 2))
        return str1 + '...' + str2
    }
    return str
}
export default function logMultiPersistence({
    goalNumber,
    base
}) {
    
    const startSessionTime = Date.now()
    let goalNumber_length = goalNumber.length
    let exIterations = countPermutations(BigInt(goalNumber_length), BigInt(base - 2))
    const maxMilliseconds = BigInt('9'.repeat(500))

    return function ({
        calcIterations,
        countIterations,
        currentNo,
        endTime,
        iterationsNotFoundLimit,
        iterationsPerLog,
        lastNumberFound,
        maxSteps,
        notFoundIterations,
        startTime,
        startTimeLog,
    }) {
        try {
            const numOfMilliseconds = endTime - startTime
            const numOfMillisecondsLog = endTime - startTimeLog
            const sessionMilliseconds = endTime - startSessionTime
            const cellNo = currentNo.cellsLength
            const currentNumberStr = fromMiddleStringMaxLength(currentNo.toLocaleString(), 118)
            lastNumberFound = fromMiddleStringMaxLength(lastNumberFound.toLocaleString(), 52)

            const iterationsPerSecond = Math.floor(Number(calcIterations / BigInt(Math.ceil(numOfMilliseconds / 1000))))
            const countIterationsPerSecond = Math.floor(countIterations / (numOfMilliseconds / 1000))
            const iterationsPerSecondLog = Math.floor(iterationsPerLog / (numOfMillisecondsLog / 1000))
            let timeLeft = Math.max(Number((exIterations - calcIterations) / BigInt(iterationsPerSecond + 1)) * 1000, 0)
            const notFoundTimeLeft = Math.max((iterationsNotFoundLimit - notFoundIterations) / countIterationsPerSecond * 1000, 0)
            const percentDone = (Number(calcIterations * 10_000_000_000n / exIterations * 100n) / 10_000_000_000).toFixed(8)

            if (timeLeft === Infinity || timeLeft > maxMilliseconds) timeLeft = maxMilliseconds
            timeLeft = BigInt(timeLeft)
            console.log('-'.repeat(140))
            console.log(`Current number: ${currentNumberStr} (${currentNo.cellsArr[currentNo.cellsArr.length - 1].digit},${currentNo.cellsArr[currentNo.cellsArr.length - 2]?.digit})`.padEnd(140, '.'))
            console.log(`Number found in ${maxSteps} -> ${lastNumberFound}`.padEnd(70, '-') +
                        `Current number length: ${currentNo.length.toLocaleString()} (${cellNo})`.padEnd(70, '-'))
            console.log(`Calc Iter.: ${calcIterations.toLocaleString()} (${percentDone}%)`.padEnd(70, '-') +
                        `Real Iter.: ${countIterations.toLocaleString()}`.padEnd(70, '-'))
            console.log(`Avg Calc Iter./sec: ${iterationsPerSecond.toLocaleString()} (x ${(iterationsPerSecond / countIterationsPerSecond).toFixed(2)})`.padEnd(70, '-') +
                        `Avg Real Iter./sec: ${countIterationsPerSecond.toLocaleString()}`.padEnd(70, '-'))
            console.log(`Log Iterations/sec: ${iterationsPerSecondLog.toLocaleString()}`.padEnd(70, '-') +
                        fromMiddleStringMaxLength(`NFTG left: ${getTimeString(notFoundTimeLeft)} ${notFoundIterations.toLocaleString()}/${iterationsNotFoundLimit.toLocaleString()}`, 70).padEnd(70, '-'))
            console.log(fromMiddleStringMaxLength(`Up Time: ${getTimeString(numOfMilliseconds)} (${numOfMilliseconds})`, 70).padEnd(70, '-') +
                        fromMiddleStringMaxLength(`Time left: ${getTimeString(timeLeft)}`, 70).padEnd(70, '-'))
            console.log(fromMiddleStringMaxLength(`Session: ${getTimeString(sessionMilliseconds)} (${sessionMilliseconds})`, 70).padEnd(70, '-') +
                        fromMiddleStringMaxLength(`Base: ${process.selfEnv.INIT_BASE}`, 70).padEnd(70, '-'))
        }
        catch (e) {
            //debugger
        }
}}

