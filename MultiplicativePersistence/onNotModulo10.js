
const onNotModuloBase = (currentNo) => {

    let firstCell = currentNo.cellsArr[0]
    if (firstCell.digit === 0n) {


        //let secondCell = currentNo.cellsArr[1]
        // let lastCell = currentNo.cellsArr[currentNo.cellsArr.length - 1]

        // if (lastCell.digit === 1n) {
        //     lastCell.digit++
        // }
        currentNo.cellsArr[1].count += firstCell.count
        //secondCell.count += firstCell.count
        currentNo.cellsArr.shift()
    }
}

export default onNotModuloBase