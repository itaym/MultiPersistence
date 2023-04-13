/**
 *
 * @param currentNo {HugeInt}
 * @return {HugeInt}
 */
const onNotModulo10 = (currentNo, /* base */) => {

    if (currentNo.moduloBase() === 0n) {

        let { firstCell, secondCell, lastCell } = currentNo

        if (lastCell.digit === 1n ) {
            lastCell.digit++
        }
        secondCell.count += firstCell.count
        currentNo.cellsArr.shift()
    }
}

export default onNotModulo10