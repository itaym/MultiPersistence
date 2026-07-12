/**
 * A lightweight cache built on top of `Map`, with optional decay policies.
 *
 * The cache supports two policy fields:
 *
 *   - `maxSize`   — maximum number of entries allowed (default: unlimited)
 *   - `expireIn`  — expiration time in milliseconds (default: unlimited)
 *
 * Although the decay logic is currently commented out, the class structure
 * allows future extension for automatic eviction based on size or age.
 *
 * Additional fields:
 *   - `name` — optional identifier for debugging
 *   - `x`, `y` — internal counters used for instrumentation
 *
 * @class
 * @extends Map
 *
 * @param {Object} [decayPolicy={}]
 *     Optional decay configuration.
 *
 * @param {number} [decayPolicy.maxSize=Number.MAX_SAFE_INTEGER]
 *     Maximum number of entries allowed before eviction.
 *
 * @param {number} [decayPolicy.expireIn=Number.MAX_SAFE_INTEGER]
 *     Time in milliseconds after which an entry should expire.
 *
 * @param {string} [name]
 *     Optional cache name for debugging or logging.
 */
export default class Cache extends Map {
    constructor(decayPolicy = {}, name) {
        super()
        this.x = 0
        this.y = 0
        this.name = name
        this.decayPolicy = { ...decayPolicy }

        if (!this.decayPolicy.maxSize)
            this.decayPolicy.maxSize = Number.MAX_SAFE_INTEGER
        if (!this.decayPolicy.expireIn)
            this.decayPolicy.expireIn = Number.MAX_SAFE_INTEGER
    }

    // set(key, item) {
    //     super.set(key, item)
    //     //this.x++
    //     // if ((this.x % 10_000) === 0)
    //     //console.log(this.name, this.x, this.y, ((this.y - this.x) / this.x).toFixed(4))
    //     // try {
    //     //     super.set(key, {
    //     //         // count: 0,
    //     //         // expire: Date.now() + this.decayPolicy.expireIn,
    //     //         item,
    //     //     })
    //     // }
    //     // catch (e) {
    //     //     debugger
    //     // }
    //     // if (this.size >= this.decayPolicy.maxSize) {
    //     //     const keysToDelete = []
    //     //     const now = Date.now()
    //     //
    //     //     this.forEach((item, key) => {
    //     //         if (item.expire < now) {
    //     //             keysToDelete.push(key)
    //     //         }
    //     //     })
    //     //     keysToDelete.forEach(key => this.delete(key))
    //     // }
    // }
    // get(key) {
    //     return super.get(key)
    //     //this.y++
    //     //const item = super.get(key) || { count: -1 }
    //     // item.expire = Date.now() + this.decayPolicy.expireIn
    //     // item.count++
    //     //return item.item
    // }
}