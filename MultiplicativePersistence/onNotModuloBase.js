
const onNotModuloBase = function () {

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

export default onNotModuloBase