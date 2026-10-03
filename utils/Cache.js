import now from './now.js'

/** Map with per-entry expiry and a size cap that evicts the least-used entries. */
class Cache extends Map {
    /**
     * @param {DecayPolicy} [decayPolicy={}]
     * @param {string} [name='']
     */
    constructor(decayPolicy = {}, name = '') {
        super()

        /** @type {string|undefined} */
        this.name = name
        /** @type {DecayPolicy} */
        this.decayPolicy = { ...decayPolicy }

        const max = (2 ** 24)

        this.decayPolicy.maxSize ??= max
        this.decayPolicy.maxSize = this.decayPolicy.maxSize < 1 ? max : this.decayPolicy.maxSize
        this.decayPolicy.maxSize = Math.min(this.decayPolicy.maxSize, max)

        if (!this.decayPolicy.expireIn) {
            this.decayPolicy.expireIn = max
        }
    }

    /**
     * Drops expired entries, then least-used ones until under `maxSize`.
     *
     * @returns {void}
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
     * Item for `key`, renewing its expiry and use count; `undefined` when missing or expired.
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
     * Stores `item`, evicting first when full.
     *
     * @param {*} key
     * @param {*} item
     * @returns {this}
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

export default Cache
