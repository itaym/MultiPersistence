/**
 * Whether `digitCellFactory` returns a valid fresh {@link DigitCell}.
 *
 * @param {() => DigitCell} digitCellFactory
 * @returns {boolean}
 */
const testDigitCellFactory = digitCellFactory => {
    const testDigitCell = digitCellFactory()

    return (
        (typeof testDigitCell.changed === 'boolean') &&
        (typeof testDigitCell.count === 'bigint') &&
        (typeof testDigitCell.digit === 'bigint') &&
        (testDigitCell.next === null) &&
        (testDigitCell.prev === null)
    )
}

export default testDigitCellFactory
