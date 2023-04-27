import getTimeString from '../getTimeString.js'
import countPermutations from '../countPermutations.js'
import HugeInt from '../HugeInt/index.js'
import chalk from 'chalk'

const colors = ['white', 'yellow']
let currentColor = 1

const getColor = () => {
    currentColor = 1 - currentColor
    return colors[currentColor]
}

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
    let goalNumber_length = goalNumber.length
    let exIterations = countPermutations(BigInt(goalNumber_length), BigInt(base - 2))
    const maxMilliseconds = BigInt('9'.repeat(500))

    return function ({
        calcIterations,
        countIterations,
        countSteps,
        currentNo,
        endTime,
        iterationsNotFoundLimit,
        iterationsPerLog,
        lastNumberFound,
        maxSteps,
        notFoundIterations,
        startSessionTime,
        startTime,
        startTimeLog,
    }) {
        lastNumberFound = new HugeInt(lastNumberFound, base)
        currentNo = new HugeInt(currentNo, base)
        try {
            const numOfMilliseconds = endTime - startTime
            const numOfMillisecondsLog = endTime - startTimeLog
            const sessionMilliseconds = endTime - startSessionTime
            const cellNo = currentNo.cellsLength
            const currentNumberStr = currentNo.toLocaleString()
            lastNumberFound = fromMiddleStringMaxLength(lastNumberFound.toLocaleString(), 52)

            const iterationsPerSecond = Math.floor(Number(calcIterations / BigInt(Math.ceil(numOfMilliseconds / 1000))))
            const countIterationsPerSecond = Math.floor(countIterations / (numOfMilliseconds / 1000))
            const iterationsPerSecondLog = Math.floor(iterationsPerLog / (numOfMillisecondsLog / 1000))
            let timeLeft = Math.max(Number((exIterations - calcIterations) / BigInt(iterationsPerSecond + 1)) * 1000, 0)
            const notFoundTimeLeft = Math.max((iterationsNotFoundLimit - notFoundIterations) / countIterationsPerSecond * 1000, 0)
            const percentDone = (Number(calcIterations * 1_000_000_000_000n / exIterations * 100n) / 1_000_000_000_000).toFixed(10)

            if (timeLeft === Infinity || timeLeft > maxMilliseconds) timeLeft = maxMilliseconds
            timeLeft = BigInt(timeLeft)

            const countLog = []
            for (let index in countSteps) {
                let cs = countSteps[index]
                if (cs?.count) {
                    countLog.push((index + '').padStart(2, '0').padEnd(5, ' =>') +
                        `${(cs.count.toLocaleString() + '').padStart(18, ' ')}, ${fromMiddleStringMaxLength(cs.combinations.toLocaleString(), 44).padStart(45, ' ')}, ${fromMiddleStringMaxLength(cs.iteration.toLocaleString(),18).padStart(18, ' ')}. ${fromMiddleStringMaxLength(getTimeString(endTime - cs.atRunTime - startTime) + ' (' + (calcIterations - cs.iteration).toLocaleString() + ')', 48)}`)
                }
            }

            let logStr = '-'.repeat(140) + '\n'
            logStr += fromMiddleStringMaxLength(`Current number: ${currentNumberStr} (${currentNo.cellsArr[currentNo.cellsArr.length - 1].digit},${currentNo.cellsArr[currentNo.cellsArr.length - 2]?.digit},${currentNo.cellsArr[currentNo.cellsArr.length - 3]?.digit})`, 140).padEnd(140, '.') + '\n'
            logStr += `Number found in ` + fromMiddleStringMaxLength(`${maxSteps} -> ${lastNumberFound}`, 53).padEnd(54, '-') +
                      `Current number length: ${currentNo.length.toLocaleString()} (${cellNo})`.padEnd(70, '-') + '\n'
            logStr += `Calc Iter.: ${calcIterations.toLocaleString()} (${percentDone}%)`.padEnd(70, '-') +
                      `Real Iter.: ${countIterations.toLocaleString()} saved: ${(calcIterations - BigInt(countIterations)).toLocaleString()}`.padEnd(70, '-') + '\n'
            logStr += `Avg Calc Iter./sec: ${iterationsPerSecond.toLocaleString()} (x ${(iterationsPerSecond / countIterationsPerSecond).toFixed(2)})`.padEnd(70, '-') +
                      `Avg Real Iter./sec: ${countIterationsPerSecond.toLocaleString()}`.padEnd(70, '-') + '\n'
            logStr += `Log Iterations/sec: ${iterationsPerSecondLog.toLocaleString()}`.padEnd(70, '-') +
                      fromMiddleStringMaxLength(`NFTG left: ${getTimeString(notFoundTimeLeft)} ${notFoundIterations.toLocaleString()}/${iterationsNotFoundLimit.toLocaleString()}`, 70).padEnd(70, '-') + '\n'
            logStr += fromMiddleStringMaxLength(`Up Time: ${getTimeString(numOfMilliseconds)} (${numOfMilliseconds})`, 70).padEnd(70, '-') +
                      fromMiddleStringMaxLength(`Time left: ${getTimeString(timeLeft)}`, 70).padEnd(70, '-') + '\n'
            logStr += fromMiddleStringMaxLength(`Session: ${getTimeString(sessionMilliseconds)} (${sessionMilliseconds})`, 70).padEnd(70, '-') +
                      fromMiddleStringMaxLength(`Base: ${process.env.INIT_BASE}`, 70).padEnd(70, '-')+ '\n'

            currentColor = 1
            countLog.forEach(logString => logStr += chalk[getColor()](logString) + '\n')
            logStr = logStr.substring(0, logStr.length - 1)
            return logStr
            //console.log(logStr)
        }
        catch (e) {
            //debugger
        }
}}

