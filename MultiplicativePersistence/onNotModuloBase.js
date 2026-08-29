/**
 * Normalizes a HugeInt when its leading digit is zero.
 *
 * Removes the first cell if its digit is zero and merges its count
 * into the next cell, updating list pointers accordingly.
 *
 * @method normalizeLeadingDigit
 * @this HugeInt
 *
 * @returns {void}
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
