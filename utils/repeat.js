/**
 * Returned by `repeat(fn)`; `.for(count)` sets how many calls.
 *
 * @typedef {Object} Repeater
 * @property {(count: number|bigint) => RepeatCount} for takes the number of calls, `Infinity` allowed
 */

/**
 * Returned by `.for(count)`; `.times()` makes the calls.
 *
 * @typedef {Object} RepeatCount
 * @property {() => void} times calls `fn` `count` times
 */

/**
 * Calls `fn` `count` times on `.times()`, passing the index from 0 up.
 *
 * @param {(index: number|bigint) => void} fn called with the index, from 0 up, same type as `count`
 * @returns {Repeater}
 */
const repeat = fn => ({
    /**
     * Sets how many times `fn` is called.
     *
     * @param {number|bigint} count number of calls, `Infinity` allowed
     * @returns {RepeatCount}
     */
    for: count => ({
        /**
         * Calls `fn` `count` times, passing the index from 0 up.
         *
         * @returns {void}
         */
        times: () => {
            for (let index = typeof count === 'bigint' ? 0n : 0; index < count; index++) {
                fn(index)
            }
        },
    }),
})

export default repeat
