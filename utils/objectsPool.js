const symbolIndex = Symbol('index')
let pools = []
let poolSize
let numOfPools
let currentPool = -1

/**
 * An array of objects, each tagged with a hidden `symbolIndex` for its slot; the pool carries its own.
 *
 * @typedef {Object[]} PoolArray
 * @property {number} [symbolIndex] internal index of the pool itself
 */

/**
 * Creates a pool of `poolSize` objects, tagged with `index`.
 *
 * @param {number} poolSize
 * @param {number} index index of this pool in the global `pools` array
 * @returns {PoolArray}
 */
const _createPool = (poolSize, index) => {
    const pool = /** @type PoolArray */ new Array(poolSize)
        .fill(0)
        .map((_, i) => ({ [symbolIndex]: i }))

    pool[symbolIndex] = index
    return pool
}

/**
 * Initializes the global pool system: `initNumOfPools` pools of `poolInitSize` objects each.
 *
 * @param {number} initNumOfPools
 * @param {number} poolInitSize
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
 * Returns a pool to the pool list (swap-based, O(1)).
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
 * Acquires a pool and returns its `getObject` / `dropObject` / `dropPool` interface.
 *
 * @returns {{
 *   dropObject: (obj: object) => void,
 *   dropPool: () => void,
 *   getObject: () => object
 * }}
 */
export const getPool = () => {
    const pool = _getPool()
    let lastObject = -1

    /**
     * Allocates the next object from the pool.
     *
     * @returns {object}
     */
    const getObject = () => pool[++lastObject]

    /**
     * Returns an object to the pool (swap-based, O(1)).
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
        dropObject,
        dropPool: _dropPool.bind(null, pool),
        getObject,
    }
}
