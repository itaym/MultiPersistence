import HugeInt from '../HugeInt/index.js'
import testPerformances from './testPerformances.js'
import { HugeInt2 } from '../HugeInt/HugeInt.js'

const multiplyBy = 1
const numIterations = 1_000_000_001
const showAfter = 1_000_000
const warmupIterations = 1_000_000

const base = 10n

const moduloBase1 = function () {

    let firstCell = this.cellsArr[this.startIndex]

    if (firstCell.digit === 0n) {

        let secondCell = this.cellsArr[this.startIndex + 1]

        secondCell.count += firstCell.count

        this.startIndex++

        if (this.startIndex> 1_000) {
            this.initStartIndex()
        }
    }
}
const moduloBase2 = function () {

    let firstCell = this.firstCell

    if (firstCell.digit === 0n) {

        let secondCell = this.firstCell.next

        secondCell.count += firstCell.count

        secondCell.prev = null
        this.firstCell = secondCell
    }
}

const currentNo1 = new HugeInt(0n, base)
const currentNo2 = new HugeInt2(0n, base)
const moduloBaseBind1 = moduloBase1.bind(currentNo1)
const moduloBaseBind2 = moduloBase2.bind(currentNo2)

currentNo1.fromString('2'.repeat(1), base)
currentNo2.fromString('2'.repeat(1), base)

const test_1 = function() {
    moduloBaseBind1()
}
const test_2 = function() {
    moduloBaseBind2()
}
const getArgs_1 = () => currentNo1.addOneToSorted(0)
const getArgs_2 = () => currentNo2.addOneToSorted()

testPerformances({ test_1, test_2, getArgs_1, getArgs_2 }, {
    multiplyBy,
    numIterations,
    showAfter,
    warmupIterations,
})