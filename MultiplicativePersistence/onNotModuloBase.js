/**
 *
 */
const onNotModuloBase = function () {

    let firstCell = this.firstCell

    if (firstCell.digit === 0n) {

        let secondCell = this.firstCell.next

        secondCell.count += firstCell.count

        secondCell.prev = null
        this.firstCell = secondCell
    }
}
export default onNotModuloBase