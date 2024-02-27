
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

    set(key, item) {
        this.x++
        // if ((this.x % 10_000) === 0)
        //console.log(this.name, this.x, this.y, ((this.y - this.x) / this.x).toFixed(4))
        try {
            super.set(key, {
                // count: 0,
                // expire: Date.now() + this.decayPolicy.expireIn,
                item,
            })
        }
        catch (e) {
            debugger
        }
        // if (this.size >= this.decayPolicy.maxSize) {
        //     const keysToDelete = []
        //     const now = Date.now()
        //
        //     this.forEach((item, key) => {
        //         if (item.expire < now) {
        //             keysToDelete.push(key)
        //         }
        //     })
        //     keysToDelete.forEach(key => this.delete(key))
        // }
    }
    get(key) {
        //this.y++
        const item = super.get(key) || { count: -1 }
        // item.expire = Date.now() + this.decayPolicy.expireIn
        // item.count++
        return item.item
    }
}