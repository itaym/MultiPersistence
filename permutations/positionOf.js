import countPermutations from './countPermutations.js'
import HugeIntEx from '#HugeIntEx/index.js'

/**
 * Exact count of non-decreasing digit sequences of length `length` over an alphabet of
 * `size` values (`1n` for the trivial empty completion when `length` is `0n`).
 *
 * @param {BigInt} length
 * @param {BigInt} size
 * @returns {BigInt}
 */
const exactCount = (length, size) => {
    if (length === 0n) return 1n
    return countPermutations(length, size) - countPermutations(length - 1n, size)
}

/**
 * Position of `numberValue` in the ordered list of canonical (non-decreasing, digits in
 * `[2, base-1]`) numbers — the same count `multiPerSearch` accumulates as `calcIterations`
 * reaching it from the start of that list.
 *
 * @param {BigInt} numberValue
 * @param {BigInt} base
 * @returns {BigInt}
 */
export const positionOf = (numberValue, base) => {
    const alphabetSize = base - 2n
    const number = new HugeIntEx(numberValue, base)
    const length = number.length

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
 * The canonical number sitting at `position` in the ordered list — the inverse of {@link positionOf}.
 *
 * @param {BigInt} position
 * @param {BigInt} base
 * @returns {BigInt}
 */
export const numberAt = (position, base) => {
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
