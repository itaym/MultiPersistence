/**
 * Whether `digitCellFactory()` returns an object with the required DigitCell fields and types.
 *
 * @param {() => Object} digitCellFactory
 * @returns {boolean}
 */
export const testDigitCellFactory = (digitCellFactory) => {
    const testDigitCell = digitCellFactory()

    return (
        (typeof(testDigitCell.changed) === 'boolean') &&
        (typeof(testDigitCell.count) === 'bigint') &&
        (typeof(testDigitCell.digit) === 'bigint') &&
        (testDigitCell.next === null) &&
        (testDigitCell.prev === null)
    )
}
