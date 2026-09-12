import { numberAt, positionOf } from './positionOf.js'

/**
 * The number reached after advancing `sourceNo` by exactly `iterations` calcIterations —
 * computed directly via {@link positionOf} / {@link numberAt}, no stepping loop.
 *
 * @param {BigInt} sourceNo starting number
 * @param {BigInt} base
 * @param {BigInt} iterations calcIterations to advance by
 * @returns {BigInt} the number reached
 */
const advanceBy = (sourceNo, base, iterations) => numberAt(positionOf(sourceNo, base) + iterations, base)

export default advanceBy
