const symbolIndex = Symbol('index')
let pools = []
let poolSize
let numOfPools
let currentPool = -1

/**
 * A single pool is an array of objects, each object containing a hidden
 * `symbolIndex` property indicating its position inside the pool.
 *
 * The pool itself also stores its own index using the same symbol.
 *
 * @typedef {Object[]} PoolArray
 * @property {number} [symbolIndex]  Internal index of the pool itself.
 */

/**
 * Create a new pool containing `poolSize` objects.
 *
 * Each object inside the pool is shaped like:
 *   { [symbolIndex]: objectIndex }
 *
 * The pool itself also receives:
 *   pool[symbolIndex] = poolIndex
 *
 * @param {number} poolSize
 *     Number of objects inside the pool.
 *
 * @param {number} index
 *     Index of this pool inside the global `pools` array.
 *
 * @returns {PoolArray}
 *     A newly created pool.
 */
const _createPool = (poolSize, index) => {
    const pool = /** @type PoolArray */ new Array(poolSize)
        .fill(0)
        .map((_, i) => ({ [symbolIndex]: i }))

    pool[symbolIndex] = index
    return pool
}

/**
 * Initialize the global pool system.
 *
 * Creates `initNumOfPools` pools, each containing `poolInitSize` objects.
 *
 * @param {number} initNumOfPools
 *     Number of pools to create.
 *
 * @param {number} poolInitSize
 *     Number of objects inside each pool.
 */
export const initPools = (initNumOfPools, poolInitSize) => {
    poolSize = poolInitSize
    numOfPools = initNumOfPools
    pools = new Array(numOfPools)

    for (let poolIndex = 0; poolIndex < numOfPools; poolIndex++) {
        pools[poolIndex] = _createPool(poolSize, poolIndex)
    }
}

/**
 * Retrieve the next available pool.
 *
 * @returns {PoolArray}
 */
const _getPool = () => pools[++currentPool]

/**
 * Return a pool back into the pool list.
 *
 * This performs a swap‑based O(1) reinsertion:
 *   - Swap the dropped pool with the last used pool
 *   - Update their internal indices
 *   - Decrement `currentPool`
 *
 * @param {PoolArray} pool
 */
const _dropPool = (pool) => {
    const lastUsedPool = pools[currentPool]

    // swap pool indices
    lastUsedPool[symbolIndex] = pool[symbolIndex]
    pools[lastUsedPool[symbolIndex]] = lastUsedPool

    pool[symbolIndex] = currentPool
    pools[currentPool] = pool

    currentPool--
}

/**
 * Acquire a pool and return an interface for object allocation/deallocation.
 *
 * The returned interface contains:
 *
 *   - `getObject()` → allocate next object from the pool
 *   - `dropObject(obj)` → return an object back to the pool (swap‑based O(1))
 *   - `dropPool()` → return the entire pool back to the global pool list
 *
 * @returns {{
 *   getObject: () => object,
 *   dropObject: (obj: object) => void,
 *   dropPool: () => void
 * }}
 */
export const getPool = () => {
    const pool = _getPool()
    let lastObject = -1

    /**
     * Allocate the next object from the pool.
     *
     * @returns {object}
     */
    const getObject = () => pool[++lastObject]

    /**
     * Return an object back to the pool.
     *
     * Uses swap‑based O(1) reinsertion:
     *   - Swap the dropped object with the last used object
     *   - Update their internal indices
     *   - Decrement `lastObject`
     *
     * @param {object} obj
     */
    const dropObject = (obj) => {
        const lastUsedObj = pool[lastObject]

        // swap object indices
        lastUsedObj[symbolIndex] = obj[symbolIndex]
        pool[lastUsedObj[symbolIndex]] = lastUsedObj

        obj[symbolIndex] = lastObject
        pool[lastObject] = obj

        lastObject--
    }

    return {
        dropPool: _dropPool.bind(null, pool),
        getObject,
        dropObject,
    }
}
