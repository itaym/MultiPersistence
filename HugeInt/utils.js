/**
 * Tests whether a DigitCell factory returns a valid DigitCell object.
 * Validates required fields and their types.
 *
 * @param {() => Object} digitCellFactory
 *     Factory function that must return a DigitCell‑like object.
 *
 * @returns {boolean}
 *     True if the returned object contains the required DigitCell fields.
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
