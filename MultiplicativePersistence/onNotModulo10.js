
const onNotModuloBase = (currentNo) => {

    let firstCell = currentNo.firstCell
    if (firstCell.digit === 0n) {


        let secondCell = currentNo.secondCell
        // let lastCell = currentNo.cellsArr[currentNo.cellsArr.length - 1]

        // if (lastCell.digit === 1n) {
        //     lastCell.digit++
        // }
        //currentNo.cellsArr[1].count += firstCell.count
        secondCell.count += firstCell.count
        secondCell.powerBy = undefined

        //currentNo.cellsArr.shift()
        currentNo.startIndex++

        if (currentNo.startIndex > 1_000) {
            currentNo.initStartIndex()
        }
    }
}

export default onNotModuloBase