import advanceBy from './advanceBy.js'

/**
 * The end boundary of a segment starting at `startAt` that checks exactly `count` numbers,
 * `startAt` included.
 *
 * @param {BigInt} startAt
 * @param {BigInt} base
 * @param {BigInt} count numbers to check, including `startAt`
 * @returns {BigInt}
 */
const segmentEndAt = (startAt, base, count) => advanceBy(startAt, base, count - 1n)

export default segmentEndAt
