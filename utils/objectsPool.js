
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
    const pool = new Array(poolSize).fill(0).map((_, index) => ({ __index: index }))
    pool.__index = index
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
    lastUsedPool.__index = pool.__index
    pools[lastUsedPool.__index] = lastUsedPool
    pool.__index = currentPool
    pools[currentPool] = pool
    currentPool--
}

/**
 *
 * @return {{getObject: (function(): *), dropObject: dropObject, dropPool: *}}
 */
export const getPool = () => {
    console.log({currentPool})

    const pool = _getPool()
    //if (currentPool === 4) debugger
    if (pool === undefined) debugger
    let lastObject = -1

    /**
     *
     * @return {object}
     */
    const getObject = () => {
        try {
            return pool[++lastObject]
        }
        catch (e) {
            debugger
        }
    }

    /**
     *
     * @param {object} obj
     */
    const dropObject = (obj) => {
        const lastUsedObj = pool[lastObject]
        try {
            lastUsedObj.__index = obj.__index
        } catch (e) {
            debugger
        }
        pool[lastUsedObj.__index] = lastUsedObj
        obj.__index = lastObject
        pool[lastObject] = obj
        lastObject--
    }
    return {
        dropPool: _dropPool.bind(null, pool),
        getObject,
        dropObject,
    }
}