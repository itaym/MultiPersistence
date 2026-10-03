import countPermutations from './countPermutations.js'

/**
 * Canonical numbers of exactly `length` digits over `size` digit values.
 *
 * @param {bigint} length
 * @param {bigint} size
 * @returns {bigint}
 */
const exactCount = (length, size) => {
    if (length === 0n) return 1n
    return countPermutations(length, size) - countPermutations(length - 1n, size)
}

/**
 * Position of `number` in the canonical (non-decreasing digits, no 0 or 1) order.
 *
 * @param {HugeInt} number
 * @returns {bigint}
 */
export const positionOf = number => {
    const { base } = number
    const alphabetSize = base - 2n
    const { length } = number

    const cellsMsbToLsb = []
    for (let cell = number.firstCell; cell; cell = cell.next) cellsMsbToLsb.unshift(cell)

    let position = countPermutations(length - 1n, alphabetSize)
    let remaining = length
    let minDigit = 1n

    for (const cell of cellsMsbToLsb) {
        const digit = cell.digit - 1n

        position += exactCount(remaining, alphabetSize - minDigit + 1n) -
            exactCount(remaining, alphabetSize - digit + 1n)

        remaining -= cell.count
        minDigit = digit
    }

    return position
}

/**
 * Canonical number at `position`; inverse of {@link positionOf}.
 *
 * @param {bigint} base
 * @param {bigint} position
 * @returns {bigint}
 */
export const numberAt = (base, position) => {
    const alphabetSize = base - 2n

    let length = 1n
    while (countPermutations(length, alphabetSize) <= position) length++

    let localPosition = position - countPermutations(length - 1n, alphabetSize)
    let minDigit = 1n
    let remaining = length
    let value = 0n

    for (let i = 0n; i < length; i++) {
        let digit = minDigit

        while (true) {
            const blockSize = exactCount(remaining - 1n, alphabetSize - digit + 1n)
            if (localPosition < blockSize) break
            localPosition -= blockSize
            digit++
        }

        value = value * base + (digit + 1n)
        minDigit = digit
        remaining -= 1n
    }

    return value
}
