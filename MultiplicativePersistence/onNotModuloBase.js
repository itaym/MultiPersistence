
const onNotModuloBase = (currentNo) => {

    let firstCell = currentNo.firstCell
    if (firstCell.digit === 0n) {


        let secondCell = currentNo.secondCell

        secondCell.count += firstCell.count
        secondCell.changed = true

        currentNo.startIndex++

        if (currentNo.startIndex > 1_000) {
            currentNo.initStartIndex()
        }
    }
}

export default onNotModuloBase