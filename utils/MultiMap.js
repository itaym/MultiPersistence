/** Map that chains inner Maps past V8's ~16.7M entry limit. */
class MultiMap {
    /** Starts with one empty inner Map. */
    constructor() {
        /** @type {Map[]} inner Maps, newest last */
        this.maps = [new Map()]
    }

    /** @type {number} entries per inner Map */
    #sizeLimit = 16_777_216

    /**
     * Value for `key`, newest inner Map first.
     *
     * @param {*} key
     * @returns {*}
     */
    get(key) {
        let entry
        for (let i = this.maps.length - 1; i >= 0; i--) {
            entry = this.maps[i].get(key)
            if (entry) return entry
        }
        return undefined
    }

    /**
     * Sets `key` in the newest inner Map, opening a new one when it is full.
     *
     * @param {*} key
     * @param {*} item
     * @returns {void}
     */
    set(key, item) {
        if (this.maps[this.maps.length - 1].size === this.#sizeLimit) {
            this.maps.push(new Map())
        }
        this.maps[this.maps.length - 1].set(key, item)
    }
}

export default MultiMap
