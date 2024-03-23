
const onNotModuloBase = function () {

    let firstCell = this.firstCell

    if (firstCell.digit === 0n) {

        let secondCell = this.secondCell

        secondCell.count += firstCell.count

        this.startIndex++

        if (this.startIndex> 1_000) {
            this.initStartIndex()
        }
    }
}

export default onNotModuloBase