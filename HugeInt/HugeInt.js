import { digitsObj as baseDigits, digitsValue, toBigInt } from '../Digits/index.js'

/**
 * A single digit-cell in the HugeInt linked list.
 *
 * @typedef {Object} DigitCell
 * @property {boolean} changed
 *     Indicates whether the cell was modified since the last persistence calculation.
 *
 * @property {BigInt} count
 *     Number of consecutive occurrences of this digit.
 *
 * @property {BigInt} digit
 *     The digit value (0 ≤ digit < base).
 *
 * @property {DigitCell|null} next
 *     Pointer to the next cell (more significant digit).
 *
 * @property {DigitCell|null} prev
 *     Pointer to the previous cell (less significant digit).
 *
 * @property {BigInt} result
 *     Cached result used by multiplicative persistence algorithms.
 */

/**
 * Represents a large integer using a compressed linked‑list structure of digit cells.
 *
 * Each digit cell stores:
 *  - a digit (0 ≤ digit < base)
 *  - a count (how many times the digit repeats consecutively)
 *  - links to previous and next cells
 *
 * This structure is optimized for:
 *  - extremely fast incremental mutation (addOne, subtractOne)
 *  - efficient multiplicative persistence calculations
 *  - minimal memory churn during long-running numeric searches
 *
 * The number is stored in **least-significant-digit-first** order:
 *  firstCell → the lowest digit
 *  lastCell  → the highest digit
 *
 * Adjacent cells **never** contain the same digit. Repeated digits are merged
 * into a single cell with count > 1.
 *
 * @class HugeInt
 */
export class HugeInt {

    /**
     * Constructs a HugeInt from an initial BigInt value.
     *
     * Behavior:
     *  - If initValue === 0n, creates a single cell containing digit 0.
     *  - Otherwise, decomposes the number into base‑digits, compressing repeated digits
     *    into single cells with count > 1.
     *
     * Invariants preserved:
     *  - firstCell.prev === null
     *  - lastCell.next === null
     *  - adjacent cells never share the same digit
     *
     * @constructor
     * @param {BigInt} [initValue=0n]
     *     Initial numeric value to represent.
     *
     * @param {BigInt} [base=10n]
     *     Numerical base used for digit decomposition.
     *
     * @returns {HugeInt}
     */
    constructor(initValue = 0n, base = 10n) {

        this.#base = base
        this.#baseMinusOne = this.#base - 1n

        if (initValue === 0n) {
            this.firstCell = {
                additionSum: 0n,
                changed: true,
                count: 1n,
                digit: 0n,
                next: null,
                prev: null,
                multiplySum: 0n,
            }
            this.lastCell = this.firstCell
        } else {
            const digit = initValue % base
            initValue /= base
            let currentCell = {
                additionSum: 0n,
                changed: true,
                count: 1n,
                digit,
                next: null,
                prev: null,
                multiplySum: 0n,
            }
            this.firstCell = currentCell
            while (initValue !== 0n) {
                const digit = initValue % base
                initValue /= base
                if (currentCell.digit === digit) {
                    currentCell.count++
                } else {
                    currentCell.next = {
                        additionSum: 0n,
                        changed: true,
                        count: 1n,
                        digit,
                        next: null,
                        prev: currentCell,
                        multiplySum: 0n,
                    }
                    currentCell = currentCell.next
                }
            }
            this.lastCell = currentCell
        }
    }
    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@PRIVATE FIELDS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */
    /**
     * @private
     * @type {BigInt}
     * Base used for digit decomposition and arithmetic.
     */
    #base
    /**
     * @private
     * @type {BigInt}
     * Cached value of (base - 1n), used for geometric series calculations.
     */
    #baseMinusOne

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@GETTERS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */

    get base() {
        return this.#base
    }
    /**
     * Returns the digit-cell immediately preceding the last (most significant) cell.
     *
     * Behavior:
     *  - If the number contains only one cell, this getter returns `null`.
     *  - Otherwise, it returns the cell whose `next` pointer references `lastCell`.
     *
     * Use cases:
     *  - Useful for operations that need to inspect or modify the second-most-significant digit.
     *  - Often used in cell-splitting or rollover logic.
     *
     * Invariants:
     *  - `lastCell.prev` is always either a valid DigitCell or `null`.
     *
     * @readonly
     * @property {DigitCell|null}
     */
    get beforeLastCell() {
        return this.lastCell.prev
    }

    /**
     * Returns the number of digit-cells in the linked list.
     *
     * Behavior:
     *  - Counts the number of distinct digit groups, not the total number of digits.
     *  - For example, the number 111223 has 3 cells: '111', '22", "3".
     *
     * Complexity:
     *  - O(n) in number of cells.
     *
     * Use cases:
     *  - Debugging
     *  - Structural analysis
     *  - Performance tuning
     *
     * @readonly
     * @property {number}
     */
    get cellsLength() {
        let count = 0
        let cell = this.firstCell
        while (cell) {
            count++
            cell = cell.next
        }
        return count
    }

    /**
     * First digit-cell (the least significant digit).
     * Always non-null after construction.
     *
     * @type {DigitCell|null}
     */
    firstCell = null

    /**
     * Last digit-cell (most significant digit).
     * Always non-null after construction.
     *
     * @type {DigitCell|null}
     */
    lastCell = null

    /**
     * Returns the total number of digits represented by the HugeInt.
     *
     * Behavior:
     *  - Sums the `count` field of each digit-cell.
     *  - For example, the number 111223 has length 6.
     *
     * Complexity:
     *  - O(n) in number of cells.
     *
     * Use cases:
     *  - Persistence calculations
     *  - Permutation generation
     *  - Logging and statistics
     *
     * @readonly
     * @property {BigInt}
     */
    get length() {
        let count = 0n
        let cell = this.firstCell
        while (cell) {
            count += cell.count
            cell = cell.next
        }
        return count
    }

    /**
     * Returns the second digit-cell (the one after `firstCell`).
     *
     * Behavior:
     *  - If the number contains only one cell, returns `null`.
     *
     * Use cases:
     *  - Helpful for algorithms that need to inspect the next digit group.
     *  - Often used in rollover logic and cell-splitting operations.
     *
     * @readonly
     * @property {DigitCell|null}
     */
    get secondCell() {
        return this.firstCell.next
    }

    /**
     * Computes and returns the full numeric value represented by the HugeInt.
     *
     * Behavior:
     *  - Reconstructs the number by expanding each digit-cell into its repeated digits.
     *  - Uses geometric series to compute repeated-digit blocks efficiently:
     *      digit * ((base^count - 1) / (base - 1)) * (base^power)
     *
     * Complexity:
     *  - O(n) in number of cells, but involves BigInt exponentiation.
     *  - This is intentionally expensive and should NOT be used inside tight loops.
     *
     * Use cases:
     *  - Logging
     *  - Debugging
     *  - Final output after search
     *
     * Side effects:
     *  - None. Pure computation.
     *
     * @readonly
     * @property {BigInt}
     */
    get value() {
        const o = this
        let value = 0n
        let power = 0n
        let cell = this.firstCell

        while (cell) {
            value += cell.digit * (((o.#base ** cell.count) - 1n) / o.#baseMinusOne) * (o.#base ** power)
            power += cell.count

            cell = cell.next
        }
        return value
    }

    /**
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     * @section @@METHODS
     * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
     */

    /**
     * Inserts a new digit-cell immediately after the specified `currentCell`.
     *
     * Behavior:
     *  - Updates `prev` and `next` pointers of all affected cells.
     *  - Ensures the linked-list structure remains valid.
     *  - If the inserted cell becomes the last cell (i.e., `currentCell.next` was null),
     *    updates `this.lastCell` accordingly.
     *
     * Invariants preserved:
     *  - Adjacent cells never share the same digit unless explicitly intended by caller.
     *  - `firstCell.prev` remains null.
     *  - `lastCell.next` remains null.
     *
     * Side effects:
     *  - Mutates the linked list structure.
     *
     * Complexity:
     *  - O(1)
     *
     * @method addCellAfter
     * @param {DigitCell} currentCell
     *     The cell after which the new cell will be inserted.
     *
     * @param {DigitCell} cell
     *     The new cell to insert. Caller must ensure its fields are valid.
     *
     * @returns {DigitCell}
     *     The inserted cell.
     */
    addCellAfter(currentCell, cell) {
        currentCell.next && (currentCell.next.prev = cell)

        cell.next = currentCell.next
        currentCell.next = cell
        cell.prev = currentCell

        !cell.next && (this.lastCell = cell)

        return cell
    }

    /**
     * Inserts a new digit-cell immediately before the specified `currentCell`.
     *
     * Behavior:
     *  - Updates `prev` and `next` pointers of all affected cells.
     *  - If the inserted cell becomes the first cell (i.e., `currentCell.prev` was null),
     *    updates `this.firstCell` accordingly.
     *
     * Invariants preserved:
     *  - Linked list remains structurally sound.
     *  - Adjacent cells do not share identical digits unless caller intends it.
     *
     * Side effects:
     *  - Mutates the linked list structure.
     *
     * Complexity:
     *  - O(1)
     *
     * @method addCellBefore
     * @param {DigitCell} currentCell
     *     The cell before which the new cell will be inserted.
     *
     * @param {DigitCell} cell
     *     The new cell to insert.
     *
     * @returns {DigitCell}
     *     The inserted cell.
     */
    addCellBefore(currentCell, cell) {
        currentCell.prev && (currentCell.prev.next = cell)
        cell.prev = currentCell.prev
        currentCell.prev = cell
        cell.next = currentCell

        !cell.prev && (this.firstCell = cell)

        return cell
    }

    /**
     * Replaces the current HugeInt contents with a new value parsed from a string.
     *
     * Behavior:
     *  - Splits the string into groups of repeated digits using a regex.
     *  - Converts each group into a digit-cell with `count = group.length`.
     *  - Rebuilds the linked list from least-significant to most-significant digit.
     *  - Updates internal base fields (`#base`, `#baseMinusOne`).
     *
     * Important:
     *  - This method **mutates the entire HugeInt**, replacing all existing cells.
     *  - A temporary trailing cell is created and then removed to finalize the structure.
     *
     * Invariants preserved:
     *  - Adjacent cells never share the same digit.
     *  - `firstCell.prev === null`
     *  - `lastCell.next === null`
     *
     * Complexity:
     *  - O(n) in number of digit groups.
     *
     * @method fromString
     * @param {string} str
     *     String representation of the number in the given base.
     *
     * @param {BigInt} base
     *     Numerical base used to interpret the digits.
     *
     * @returns {HugeInt}
     *     The mutated instance (for chaining).
     */
    fromString(str, base) {
        const digitsArr = str.match(/((.)\2*)/g) || [str]

        this.#base = base
        this.#baseMinusOne = this.#base - 1n

        let currentCell = this.firstCell

        for (let index = digitsArr.length - 1; index > -1; index--) {

            currentCell.count = toBigInt[digitsArr[index].length]
            currentCell.digit = digitsValue[digitsArr[index][0]]

            currentCell.next = {
                additionSum: 0n,
                changed: true,
                count: 0n,
                digit: 0n,
                next: null,
                prev: currentCell,
                multiplySum: 0n,
            }
            currentCell = currentCell.next
        }
        this.lastCell = currentCell.prev
        this.lastCell.next = null

        return this
    }
    static maxBigInt = (...args) => args.reduce((a, b) => (a > b ? a : b))
    static minBigInt = (...args) => args.reduce((a, b) => (a < b ? a : b))

    /**
     * A single digit-cell in the HugeInt linked list.
     *
     * @typedef {Object} DigitCell
     * @property {boolean} changed
     *     Indicates whether the cell was modified since the last persistence calculation.
     *
     * @property {BigInt} count
     *     Number of consecutive occurrences of this digit.
     *
     * @property {BigInt} digit
     *     The digit value (0 ≤ digit < base).
     *
     * @property {DigitCell|null} next
     *     Pointer to the next cell (more significant digit).
     *
     * @property {DigitCell|null} prev
     *     Pointer to the previous cell (less significant digit).
     *
     * @property {BigInt} result
     *     Cached result used by multiplicative persistence algorithms.
     */
    add(hugeInt) {

        if (this.#base !== hugeInt.base) {
            throw new Error('Base is incompatible.')
        }
        const newCell = {
            additionSum: 0n,
            changed: false,
            count: 0n,
            digit: -1n,
            next: null,
            prev: null,
            multiplySum: 0n,
        }
        const firstLength = HugeInt.maxBigInt(this.length, hugeInt.length)
        const firstHugeInt = this.length >= hugeInt.length ? this : hugeInt
        const secondHugeInt = this.length >= hugeInt.length ? hugeInt : this
        const base = this.#base

        let carry = 0n

        let firstCell = firstHugeInt.firstCell
        let secondCell = secondHugeInt.firstCell
        let firstIndex = 0n
        let secondIndex = 0n
        let aNewCell = { ...newCell }
        const aNewFirstCell = aNewCell

        for (let index = 0; index < firstLength; index++) {

            firstIndex++
            secondIndex++

            let secondDigit = secondCell ? secondCell.digit : 0n
            let sum = firstCell.digit + secondDigit + carry
            let digit = sum % base
            carry = sum / base

            if (aNewCell.digit === -1n) {
                aNewCell.count = 1n
                aNewCell.digit = digit
            }
            else if (aNewCell.digit === digit) {
                aNewCell.count++
            }
            else {
                aNewCell.next = { ...newCell }
                aNewCell.next.prev = aNewCell
                aNewCell = aNewCell.next
                aNewCell.count = 1n
                aNewCell.digit = digit
            }

            if (firstIndex === firstCell.count) {
                firstIndex = 0n
                firstCell = firstCell.next
            }
            if (secondCell && secondIndex === secondCell.count) {
                secondIndex = 0n
                secondCell = secondCell.next
            }
        }
        if (carry > 0n) {
            aNewCell.next = { ...newCell }
            aNewCell.next.prev = aNewCell
            aNewCell = aNewCell.next
            aNewCell.count = 1n
            aNewCell.digit = carry
        }
        this.firstCell = aNewFirstCell
        this.lastCell = aNewCell

        return this
    }

    /**
     * Increments the HugeInt by exactly 1, mutating the digit-cell structure in place.
     *
     * Behavior:
     *  - If the digit is not at `base - 1`, increments the digit.
     *  - If the cell has `count > 1`, splits the cell so only one digit is incremented.
     *  - If the digit rolls over (digit == base - 1), sets digit to 0 and propagates
     *    the carry to the next cell.
     *  - If rollover occurs at the last cell, a new cell is appended.
     *  - Adjacent zero-cells may be merged.
     *
     * This method preserves sorted digit grouping and ensures minimal structural changes.
     *
     * Invariants preserved:
     *  - No adjacent cells share the same digit after operation.
     *  - Linked list remains valid.
     *
     * Complexity:
     *  - O(k) where k is number of rollover steps (usually very small).
     *
     * Side effects:
     *  - Mutates the HugeInt structure.
     *
     * @method addOne
     * @param {DigitCell|null} [cell=this.firstCell]
     *     The cell to increment. Defaults to the least-significant digit.
     *
     * @returns {void}
     */
    addOne(cell) {
        cell ??= this.firstCell
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }
            this.addCellAfter(cell, {
                additionSum: 0n,
                changed: true,
                count: cell.count - 1n,
                digit: cell.digit,
                next: null,
                prev: null,
                multiplySum: 0n,
            })
            cell.count = 1n
            cell.digit++
            return
        }

        cell.digit = 0n

        if (cell.prev && cell.prev.digit === 0n) {
            cell.count += cell.prev.count
            this.removeCell(cell.prev)
        }
        if (cell === this.lastCell) {
            this.addCellAfter(cell, {
                additionSum: 0n,
                changed: true,
                count: 1n,
                digit: 2n, // 1n
                next: null,
                prev: null,
                multiplySum: 0n,
            })
            return
        }
        this.addOne(cell.next)
    }

    /**
     * Increments the HugeInt by 1, assuming the digit-cells are sorted in ascending order.
     *
     * This is the primary increment method used by the multiplicative persistence search.
     * It is optimized for performance and minimal mutation.
     *
     * Behavior:
     *  - If digit < base - 1:
     *      - If count == 1, simply increment digit.
     *      - If count > 1, splits the cell so only one digit increments.
     *  - If digit == base - 1:
     *      - Sets digit to 0 and propagates carry to next cell.
     *      - If no next cell exists, appends a new cell with digit 2 (special behavior).
     *
     * Special note:
     *  - The appended digit is `2n` (not `1n`). This is intentional and part of your
     *    persistence search optimization. Document this behavior clearly.
     *
     * Invariants preserved:
     *  - No adjacent cells share the same digit.
     *  - Linked list remains valid.
     *
     * Complexity:
     *  - O(k) where k is number of rollover steps.
     *
     * Side effects:
     *  - Mutates the HugeInt structure.
     *
     * @method addOneToSorted
     * @param {DigitCell|null} [cell=this.firstCell]
     *     The cell to increment.
     *
     * @returns {void}
     */
    addOneToSorted(cell = this.firstCell) {
        cell.changed = true

        if (cell.digit !== this.#baseMinusOne) {
            if (cell.count === 1n) {
                cell.digit++
                return
            }

            this.addCellAfter(
                /** @type {DigitCell} */ cell, {
                additionSum: 0n,
                changed: true,
                count: cell.count - 1n,
                digit: cell.digit,
                next: null,
                prev: null,
                multiplySum: 0n,
            })
            cell.count = 1n
            cell.digit++
            return
        }

        cell.digit = 0n

        if (!cell.next) {
            this.addCellAfter(
                /** @type {DigitCell} */ cell, {
                additionSum: 0n,
                changed: true,
                count: 1n,
                digit: 2n,
                next: null,
                prev: null,
                multiplySum: 0n,
            })
            return
        }
        this.addOneToSorted(cell.next)
    }

    /**
     * Removes a digit-cell from the linked list.
     *
     * Behavior:
     *  - Updates `prev.next` and `next.prev` pointers.
     *  - If removing the first cell, updates `this.firstCell`.
     *  - If removing the last cell, updates `this.lastCell`.
     *
     * Invariants preserved:
     *  - Linked list remains structurally valid.
     *  - Caller must ensure removal does not violate digit-grouping rules.
     *
     * Complexity:
     *  - O(1)
     *
     * Side effects:
     *  - Mutates the HugeInt structure.
     *
     * @method removeCell
     * @param {DigitCell} cell
     *     The cell to remove.
     *
     * @returns {void}
     */
    removeCell(cell) {
        if (cell.prev) {
            cell.prev.next = cell.next
        }
        else {
            this.firstCell = cell.next
        }
        if (cell.next) {
            cell.next.prev = cell.prev
        }
        else {
            this.lastCell = cell.prev
        }

    }

    /**
     * Decrements the HugeInt by exactly 1, mutating the digit-cell structure in place.
     *
     * Behavior:
     *  - If digit > 0:
     *      - If count == 1, simply decrement digit.
     *      - If count > 1, splits the cell so only one digit decrements.
     *  - If digit == 0:
     *      - Sets digit to base - 1 and propagates borrow to next cell.
     *      - If borrow reaches the last cell, resets it to a single zero-digit.
     *
     * Invariants preserved:
     *  - No adjacent cells share the same digit.
     *  - Linked list remains valid.
     *
     * Complexity:
     *  - O(k) where k is number of borrow steps.
     *
     * Side effects:
     *  - Mutates the HugeInt structure.
     *
     * @method subtractOne
     * @param {DigitCell|null} [cell=this.firstCell]
     *     The cell to decrement.
     *
     * @returns {void}
     */
    subtractOne(cell) {
        cell ??= this.firstCell

        if (cell.digit !== 0n) {
            if (cell.count === 1n) {
                cell.digit--
                return
            } else {
                this.addCellAfter(cell, {
                    additionSum: 0n,
                    changed: true,
                    count: cell.count - 1n,
                    digit: cell.digit,
                    next: null,
                    prev: null,
                    multiplySum: 0n,
                })
                cell.count = 1n
                cell.digit--
                return
            }
        }

        cell.digit = this.#baseMinusOne

        if (cell === this.lastCell) {
            cell.count = 1n
            cell.digit = 0n
            return
        }
        this.subtractOne(cell.next)
    }

    /**
     * Determines whether the HugeInt represents a value greater than or equal to the base.
     *
     * Behavior:
     *  - Returns `true` if:
     *      - The first cell has `count > 1`, meaning at least two digits exist, OR
     *      - There is more than one digit-cell (`firstCell.next` is not null).
     *  - Returns `false` only if the number consists of exactly one digit-cell with count = 1.
     *
     * Use cases:
     *  - Quick check for whether the number is multi-digit.
     *  - Used in multiplicative persistence optimizations.
     *
     * Complexity:
     *  - O(1)
     *
     * @method isGTBase
     * @returns {boolean}
     *     Whether the number contains more than one digit.
     */
    isGTBase() {
        return this.firstCell.count > 1n || this.firstCell.next
    }

    /**
     * Counts how many times a specific digit appears in the HugeInt.
     *
     * Behavior:
     *  - Iterates through all digit-cells.
     *  - Sums the `count` of each cell whose `digit` matches the requested digit.
     *
     * Complexity:
     *  - O(n) in number of cells.
     *
     * Use cases:
     *  - Multiplicative persistence heuristics.
     *  - Digit distribution analysis.
     *
     * @method digitCount
     * @param {BigInt} digit
     *     The digit to count.
     *
     * @returns {BigInt}
     *     Total occurrences of the digit.
     */
    digitCount(digit) {
        let cell = this.firstCell
        let count = 0n
        while (cell) {
            if (cell.digit === digit) count += cell.count
            cell = cell.next
        }
        return count
    }

    /**
     * Returns the first digit-cell whose `digit` matches the specified value.
     *
     * Behavior:
     *  - Scans the linked list from least-significant to most-significant digit.
     *  - Returns the first matching cell, or `null` if no such cell exists.
     *
     * Complexity:
     *  - O(n)
     *
     * Use cases:
     *  - Structural inspection.
     *  - Optimizations that require direct access to a digit group.
     *
     * @method getCellOf
     * @param {BigInt} digit
     *     The digit to search for.
     *
     * @returns {DigitCell|null}
     *     The matching cell, or null if not found.
     */
    getCellOf(digit) {
        let cell = this.firstCell
        do {
            if (cell.digit === digit) return cell
            cell = cell.next
        } while (cell)
        return null
    }

    /**
     * Checks whether the HugeInt contains at least one occurrence of the specified digit.
     *
     * Behavior:
     *  - Iterates through digit-cells.
     *  - Returns `true` upon first match.
     *
     * Complexity:
     *  - O(n)
     *
     * Use cases:
     *  - Fast digit presence checks.
     *  - Persistence heuristics (e.g., checking for zeros or even digits).
     *
     * @method isCellOf
     * @param {BigInt} digit
     *     The digit to search for.
     *
     * @returns {boolean}
     *     Whether the digit exists in the HugeInt.
     */
    isCellOf(digit) {
        let cell = this.firstCell
        do {
            if (cell.digit === digit) return true
            cell = cell.next
        } while (cell)
        return false
    }

    /**
     * Determines whether the HugeInt represents a value less than the base.
     *
     * Behavior:
     *  - Returns `true` only if:
     *      - There is exactly one digit-cell, AND
     *      - That cell has `count === 1`.
     *  - This means the number is a single digit.
     *
     * Complexity:
     *  - O(1)
     *
     * Use cases:
     *  - Base-case checks in persistence algorithms.
     *
     * @method isLTBase
     * @returns {boolean}
     *     Whether the number is a single digit.
     */
    isLTBase() {
        return (!this.firstCell.next) && this.firstCell.count === 1n
    }

    /**
     * Returns the least-significant digit of the HugeInt.
     *
     * Behavior:
     *  - Equivalent to `value % base`, but O(1) because the first cell stores the LSD.
     *
     * Complexity:
     *  - O(1)
     *
     * Use cases:
     *  - Multiplicative persistence modulo optimizations.
     *  - Quick digit checks.
     *
     * @method moduloBase
     * @returns {BigInt}
     *     The least-significant digit.
     */
    moduloBase() {
        return this.firstCell.digit
    }

    /**
     * Checks whether the HugeInt contains at least one even digit.
     *
     * Behavior:
     *  - Iterates through digit-cells.
     *  - Returns `true` upon encountering a digit where `digit % 2n === 0n`.
     *
     * Complexity:
     *  - O(n)
     *
     * Use cases:
     *  - Persistence heuristics (even digits drastically affect multiplication).
     *
     * @method hasEvenDigits
     * @returns {boolean}
     *     Whether the number contains any even digit.
     */
    hasEvenDigits() {
        let cell = this.firstCell
        while (cell) {
            if ((cell.digit % 2n) === 0n) return true
            cell = cell.next
        }
        return false
    }

    /**
     * Counts the total number of factors of 2 contributed by all digits in the HugeInt.
     *
     * Behavior:
     *  - For each digit-cell:
     *      - Computes `log2(digit)` using floating-point math.
     *      - If the digit is a power of two (log2 is an integer),
     *        multiplies that exponent by the cell's count.
     *  - Sums all such contributions.
     *
     * Important:
     *  - Uses floating-point `Math.log2`, which is safe for small digits (0–9).
     *  - This method is used in multiplicative persistence heuristics.
     *
     * Complexity:
     *  - O(n)
     *
     * @method countTwoComponents
     * @param {DigitCell|null} [cell=this.firstCell]
     *     Starting cell for the scan.
     *
     * @returns {number}
     *     Total exponent of 2 contributed by all digits.
     */
    countTwoComponents(cell) {
        cell ??= this.firstCell
        let count = 0
        while (cell) {
            let log2 = Math.log2(Number(cell.digit))
            if (log2 === Math.floor(log2)) {
                count += log2 * Number(cell.count)
            }
            cell = cell.next
        }
        return count
    }

    /**
     * Counts the total number of factors of 2 contributed by all digits,
     * excluding the least-significant digit-cell.
     *
     * Behavior:
     *  - Equivalent to `countTwoComponents(this.firstCell.next)`.
     *
     * Use cases:
     *  - Persistence heuristics where the LSD is treated separately.
     *
     * Complexity:
     *  - O(n)
     *
     * @method countTwoComponentsNoFirstCell
     * @returns {number}
     *     Total exponent of 2 contributed by all digits except the first cell.
     */
    countTwoComponentsNoFirstCell() {
        return this.countTwoComponents(this.firstCell.next)
    }

    /**
     * Splits a digit-cell into two consecutive cells, placing the newly created cell
     * **after** the specified `cell`.
     *
     * Purpose:
     *  - Used when only part of a digit group should be incremented, decremented,
     *    or otherwise mutated.
     *  - Ensures that operations affecting only a subset of repeated digits do not
     *    corrupt the compressed representation.
     *
     * Behavior:
     *  - The original cell's `count` is reduced to `countToSplit`.
     *  - A new cell is created with:
     *      - `count = original.count - countToSplit`
     *      - `digit = original.digit`
     *      - `changed = true`
     *  - The new cell is inserted immediately after the original cell.
     *
     * Invariants preserved:
     *  - Adjacent cells never share the same digit unless caller intends it.
     *  - Linked list pointers (`prev`, `next`) remain valid.
     *  - `firstCell` and `lastCell` are updated if needed.
     *
     * Complexity:
     *  - O(1)
     *
     * Side effects:
     *  - Mutates the HugeInt structure.
     *
     * Edge cases:
     *  - Caller must ensure `countToSplit < cell.count`.
     *  - Caller must ensure `countToSplit > 0`.
     *
     * @method splitCellAfter
     * @param {DigitCell} cell
     *     The cell to split.
     *
     * @param {BigInt} countToSplit
     *     Number of digits to keep in the original cell.
     *
     * @returns {DigitCell}
     *     The newly created cell containing the remainder of the digits.
     */
    splitCellAfter(cell, countToSplit) {
        const newCell = {
            additionSum: 0n,
            changed: true,
            count: cell.count - countToSplit,
            digit: cell.digit,
            next: null,
            prev: null,
            multiplySum: 0n
        }
        this.addCellAfter(cell, newCell)
        cell.count = countToSplit
        cell.changed = true
        return newCell
    }

    /**
     * Splits a digit-cell into two consecutive cells, placing the newly created cell
     * **before** the specified `cell`.
     *
     * Purpose:
     *  - Used when operations require isolating a subset of repeated digits at the
     *    beginning of a digit group.
     *  - Supports decrement, increment, and structural transformations.
     *
     * Behavior:
     *  - A new cell is created with:
     *      - `count = countToSplit`
     *      - `digit = cell.digit`
     *      - `changed = true`
     *  - The original cell's `count` is reduced by `countToSplit`.
     *  - The new cell is inserted immediately before the original cell.
     *
     * Invariants preserved:
     *  - Linked list remains structurally valid.
     *  - Adjacent cells do not share identical digits unless caller intends it.
     *  - `firstCell` and `lastCell` are updated if needed.
     *
     * Complexity:
     *  - O(1)
     *
     * Side effects:
     *  - Mutates the HugeInt structure.
     *
     * Edge cases:
     *  - Caller must ensure `countToSplit < cell.count`.
     *  - Caller must ensure `countToSplit > 0`.
     *
     * @method splitCellBefore
     * @param {DigitCell} cell
     *     The cell to split.
     *
     * @param {BigInt} countToSplit
     *     Number of digits to extract into the new cell.
     *
     * @returns {DigitCell}
     *     The newly created cell containing the extracted digits.
     */
    splitCellBefore(cell, countToSplit) {
        const newCell = {
            additionSum: 0n,
            changed: true,
            count: countToSplit,
            digit: cell.digit,
            next: null,
            prev: null,
            multiplySum: 0n
        }
        this.addCellBefore(cell, newCell)
        cell.count -= countToSplit
        cell.changed = true
        return newCell
    }

    /**
     * Converts the HugeInt into a plain string representation in its current base.
     *
     * Behavior:
     *  - Iterates from the most-significant digit-cell (`lastCell`) down to the
     *    least-significant (`firstCell`).
     *  - For each cell, repeats the digit-character `count` times.
     *  - Uses `baseDigits.get(cell.digit)` to convert digit values into characters.
     *
     * Important:
     *  - This method expands the compressed representation into a full string.
     *  - For very large numbers, this can produce extremely long strings.
     *  - This method is intentionally O(n_digits), not O(n_cells).
     *
     * Use cases:
     *  - Logging
     *  - Debugging
     *  - Final output after search
     *
     * Complexity:
     *  - O(total_digits)
     *
     * Side effects:
     *  - None. Pure conversion.
     *
     * @method toString
     * @returns {string}
     *     The full string representation of the HugeInt.
     */
    toString() {
        let tmpStr = ''
        let cell = this.lastCell

        do {
            tmpStr += baseDigits.get(cell.digit).repeat(Number(cell.count))

            cell = cell.prev
        } while (cell)

        return tmpStr
    }

    /**
     * Converts the HugeInt into a human-friendly string with comma separators.
     *
     * Behavior:
     *  - First calls `toString()` to obtain the full digit string.
     *  - Splits the string into groups of three digits from left to right.
     *  - Joins the groups using commas.
     *
     * Example:
     *  - "1234567" → "1,234,567"
     *
     * Important:
     *  - This is purely cosmetic formatting.
     *  - Does not depend on locale rules beyond comma grouping.
     *
     * Complexity:
     *  - O(total_digits)
     *
     * Use cases:
     *  - Displaying large numbers in logs or UI.
     *
     * Side effects:
     *  - None.
     *
     * @method toLocaleString
     * @returns {string}
     *     A comma-separated representation of the HugeInt.
     */
    toLocaleString() {
        const str = this.toString()
        const arr = []
        let partLength = str.length % 3 || 3
        let index = 0
        do {
            arr.push(str.substring(index, index + partLength))
            index += partLength
            partLength = 3
        } while (index !== str.length)

        return arr.join(',')
    }

    /**
     * Enables iteration over all digit-cells in the HugeInt.
     *
     * Behavior:
     *  - Implements the JavaScript iterator protocol.
     *  - Yields each digit-cell from least-significant (`firstCell`) to
     *    most-significant (`lastCell`).
     *
     * Example usage:
     *  for (const cell of hugeInt) {
     *      console.log(cell.digit, cell.count)
     *  }
     *
     * Use cases:
     *  - Debugging
     *  - Structural inspection
     *  - Algorithms that need to traverse all digit groups
     *
     * Complexity:
     *  - O(n_cells)
     *
     * Side effects:
     *  - None.
     *
     * @method [Symbol.iterator]
     * @returns {Iterator<DigitCell|null>}
     *     An iterator over all digit-cells.
     */
    *[Symbol.iterator] () {
        let cell = this.firstCell
        while (cell) {
            yield cell
            cell = cell.next
        }
        return null
    }
}

export default HugeInt
