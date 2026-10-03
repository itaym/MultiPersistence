/** @type {symbol} key of an object's or pool's own index */
const symbolIndex = Symbol('index')

/** @type {Object[][]} all pools */
let pools = []

/** @type {number} objects per pool */
let poolSize

/** @type {number} */
let numOfPools

/** @type {number} index of the last pool in use */
let currentPool = -1

/**
 * Pool of `poolSize` indexed empty objects.
 *
 * @param {number} index pool index
 * @returns {Object[]}
 */
const _createPool = index => {
    const pool = new Array(poolSize)
        .fill(0)
        .map((_, i) => ({ [symbolIndex]: i }))

    pool[symbolIndex] = index
    return pool
}

/**
 * Creates the pools.
 *
 * @param {number} initNumOfPools
 * @param {number} poolInitSize objects per pool
 * @returns {void}
 */
export const initPools = (initNumOfPools, poolInitSize) => {
    poolSize = poolInitSize
    numOfPools = initNumOfPools
    pools = new Array(numOfPools)

    for (let poolIndex = 0; poolIndex < numOfPools; poolIndex++) {
        pools[poolIndex] = _createPool(poolIndex, poolSize)
    }
}

/**
 * Takes the next free pool.
 *
 * @returns {Object[]}
 */
const _getPool = () => pools[++currentPool]

/**
 * Returns `pool` to the free pools.
 *
 * @param {Object[]} pool
 * @returns {void}
 */
const _dropPool = pool => {
    const lastUsedPool = pools[currentPool]

    // swap pool indices
    lastUsedPool[symbolIndex] = pool[symbolIndex]
    pools[lastUsedPool[symbolIndex]] = lastUsedPool

    pool[symbolIndex] = currentPool
    pools[currentPool] = pool

    currentPool--
}

/**
 * Takes a pool and returns handles to use it.
 *
 * @returns {PoolHandles}
 */
export const getPool = () => {
    const pool = _getPool()
    let lastObject = -1

    /**
     * Takes the next free object.
     *
     * @returns {Object}
     */
    const getObject = () => pool[++lastObject]

    /**
     * Returns `obj` to the free objects.
     *
     * @param {Object} obj
     * @returns {void}
     */
    const dropObject = obj => {
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
