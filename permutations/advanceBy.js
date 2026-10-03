import HugeIntEx from '#HugeIntEx/index.js'
import {
    numberAt,
    positionOf,
} from './positionOf.js'

/**
 * Canonical number `iterations` positions after `sourceNo`.
 *
 * @param {bigint} base
 * @param {bigint} iterations canonical positions to move forward
 * @param {bigint} sourceNo starting number
 * @returns {bigint}
 */
const advanceBy = (base, iterations, sourceNo) =>
    numberAt(base, positionOf(new HugeIntEx(base, undefined, sourceNo)) + iterations)

export default advanceBy
