/**
 * Normalizes the HugeInt when its most significant digit is zero.
 *
 * Behavior:
 *  - Checks the first (most significant) cell of the HugeInt.
 *  - If the digit is `0n`, the zero-cell is removed entirely.
 *  - Its `count` is merged into the next cell's `count`.
 *  - The next cell becomes the new `firstCell`.
 *
 * Effect:
 *  - This operation does *not* simply remove a leading zero.
 *  - It redistributes digit counts, changing the digit composition of the number.
 *    Examples:
 *      2240  → 2244   (zero count absorbed into digit 4)
 *      2290  → 2299   (zero count absorbed into digit 9)
 *      999   → 2222   (zero count absorbed into digit 2 after increment logic)
 *
 * Purpose:
 *  - Ensures HugeInt remains in canonical sorted-digit form.
 *  - Prevents invalid states created during increment operations.
 *  - Acts as a structural normalization step in the persistence search loop.
 *
 * Structural notes:
 *  - Mutates the HugeInt in-place.
 *  - Updates `prev` and `next` pointers to maintain list integrity.
 *  - Only affects the first two cells; deeper cells remain unchanged.
 *
 * Performance notes:
 *  - O(1) time complexity.
 *  - Safe to call on every iteration of the search loop.
 *  - Designed to avoid expensive digit parsing or persistence checks.
 *
 * @method normalizeLeadingDigit
 * @this HugeInt
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