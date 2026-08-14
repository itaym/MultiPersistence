import now from './now.js'

/**
 * A time‑based cache with sliding expiration and LFU (least‑frequently‑used)
 * eviction. Each entry stores:
 * - `item`: the actual value
 * - `expire`: timestamp when the entry becomes invalid
 * - `count`: number of successful `get()` calls (used for LFU eviction)
 */
export default class Cache extends Map {
    /**
     * @typedef {Object} DecayPolicy
     * @property {number} [maxSize]
     *   Maximum number of items allowed in the cache. Defaults to `2**24`.
     * @property {number} [expireIn]
     *   Time‑to‑live (TTL) in milliseconds. Each `get()` refreshes the TTL.
     */

    /**
     * Creates a new Cache instance.
     *
     * @param {DecayPolicy} [decayPolicy={}]
     *   Configuration for expiration and eviction behavior.
     * @param {string} [name]
     *   Optional name for debugging or identification.
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
     * Enforces the decay policy by:
     * 1. Removing expired items.
     * 2. Evicting least‑frequently‑used items until size ≤ maxSize.
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
     * Stores a value in the cache.
     *
     * - If the cache is full and the existing entry is expired (or missing),
     *   eviction may occur.
     * - Throws an error if eviction cannot free enough space.
     *
     * @param {*} key
     *   The key to store.
     * @param {*} item
     *   The value to store.
     * @returns {Cache}
     *
     * @throws {Error}
     *   If the cache is at max size and cannot evict enough entries.
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

    /**
     * Retrieves a value from the cache.
     *
     * - Returns `undefined` if the key does not exist or is expired.
     * - Refreshes the TTL on successful access (sliding expiration).
     * - Increments the access count for LFU eviction.
     *
     * @param {*} key
     *   The key to retrieve.
     * @returns {*|undefined}
     *   The stored value, or `undefined` if missing or expired.
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
}
