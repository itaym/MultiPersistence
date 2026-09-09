import now from './now.js'

/**
 * A `Map` with sliding-expiration TTL and least-frequently-used eviction.
 */
export default class Cache extends Map {
    /**
     * @typedef {Object} DecayPolicy
     * @property {number} [expireIn] TTL in ms; each `get()` refreshes it
     * @property {number} [maxSize] max items, default `2**24`
     */

    /**
     * @param {DecayPolicy} [decayPolicy={}]
     * @param {string} [name] for debugging
     */
    constructor(decayPolicy = {}, name = undefined) {
        super()

        this.name = name
        this.decayPolicy = { ...decayPolicy }

        const max = (2 ** 24)

        this.decayPolicy.maxSize ??= max
        this.decayPolicy.maxSize = this.decayPolicy.maxSize < 1 ? max : this.decayPolicy.maxSize
        this.decayPolicy.maxSize = Math.min(this.decayPolicy.maxSize, max)

        if (!this.decayPolicy.expireIn)
            this.decayPolicy.expireIn = max
    }

    /**
     * Drops expired items, then evicts least-frequently-used ones until size ≤ maxSize.
     *
     * @private
     */
    #enforceDecayPolicy() {
        const time = +now
        for (const [k, v] of this.entries()) {
            if (v.expire < time) this.delete(k)
        }

        while (this.size >= this.decayPolicy.maxSize) {
            const items = Array.from(this.entries())
            if (items.length === 0) break

            items.sort((a, b) => (a[1].count || 0) - (b[1].count || 0))
            const keyToDelete = items[0][0]
            if (keyToDelete === undefined) break

            this.delete(keyToDelete)
        }
    }

    /**
     * Value for `key`, or `undefined` if missing or expired. Refreshes the TTL and bumps the count.
     *
     * @param {*} key
     * @returns {*|undefined}
     */
    get(key) {
        const time = now + 0
        const entry = super.get(key)

        if (!entry) return undefined

        if (entry.expire < time) {
            this.delete(key)
            return undefined
        }

        entry.expire = time + this.decayPolicy.expireIn
        entry.count++

        return entry.item
    }

    /**
     * Stores `item` under `key`, running eviction first when the cache is full.
     *
     * @param {*} key
     * @param {*} item
     * @returns {Cache}
     */
    set(key, item) {
        const existing = super.get(key)
        const time = +now

        const insertingOrReplacingExpired = !existing || existing.expire <= time
        if (this.size >= this.decayPolicy.maxSize && insertingOrReplacingExpired) {
            this.#enforceDecayPolicy()
        }

        super.set(key, {
            count: existing ? existing.count : 0,
            expire: time + this.decayPolicy.expireIn,
            item,
        })

        return this
    }
}
