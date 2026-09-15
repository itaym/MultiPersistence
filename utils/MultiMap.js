/**
 * A `Map` that never hits V8's ~16.7M (2^24) entry limit — chains additional `Map` instances
 * once the current one fills up.
 */
class MultiMap {
    constructor() {
        this.maps = [new Map()]
    }

    #sizeLimit = 16_777_216

    /**
     * @param {*} key
     * @returns {*} the value for `key`, checking each underlying `Map` from most to least recently
     *   added — `undefined` if not found
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
