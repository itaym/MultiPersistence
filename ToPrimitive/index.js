/** Object whose primitive value is `1n + fn(obj)`, computed on every coercion. */
class ToPrimitive {
    /**
     * @param {(obj: *) => *} fn called with `obj` on every coercion
     * @param {*} obj bound first argument of `fn`
     */
    constructor(fn, obj) {
        this.obj = obj
        this.fn = fn.bind(null, this.obj)
    }

    /**
     * @returns {bigint} `1n + fn(obj)`
     */
    [Symbol.toPrimitive]() {
        return 1n + this.fn()
    }
}

export default ToPrimitive
