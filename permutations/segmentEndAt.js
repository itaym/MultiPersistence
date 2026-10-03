import advanceBy from './advanceBy.js'

/**
 * Last number of a segment that checks `count` canonical numbers starting at `startAt`.
 *
 * @param {bigint} base
 * @param {bigint} count canonical numbers in the segment, `startAt` included
 * @param {bigint} startAt first number of the segment
 * @returns {bigint}
 */
const segmentEndAt = (base, count, startAt) => advanceBy(base, count - 1n, startAt)

export default segmentEndAt
