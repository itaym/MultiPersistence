const symbolIndex = Symbol('index')
let pools = []
let poolSize
let numOfPools
let currentPool = -1
/**
 *
 * @typedef {Array} PoolArray
 * @property {number} __index
 */

/**
 *
 * @param poolSize
 * @param index
 * @return {PoolArray}
 */
const _createPool = (poolSize, index) => {
    const pool = new Array(poolSize).fill(0).map((_, index) => ({ [symbolIndex]: index }))
    pool[symbolIndex] = index
    return pool
}

/**
 *
 * @param initNumOfPools {number}
 * @param poolInitSize {number}
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
 *
 * @return {PoolArray}
 */
const _getPool = () => pools[++currentPool]

/**
 *
 * @param {PoolArray} pool
 */
const _dropPool = (pool) => {
    const lastUsedPool= pools[currentPool]
    lastUsedPool[symbolIndex] = pool[symbolIndex]
    pools[lastUsedPool[symbolIndex]] = lastUsedPool
    pool[symbolIndex] = currentPool
    pools[currentPool] = pool
    currentPool--
}

/**
 *
 * @return {{getObject: (function(): object), dropObject: (function(object)), dropPool: (function())}}
 */
export const getPool = () => {
    const pool = _getPool()
    let lastObject = -1

    /**
     *
     * @return {object}
     */
    const getObject = () => pool[++lastObject]

    /**
     *
     * @param {object} obj
     */
    const dropObject = (obj) => {
        const lastUsedObj = pool[lastObject]
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