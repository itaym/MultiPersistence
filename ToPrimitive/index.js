/**
 * Wraps `obj`; converting it to a primitive yields `1n + fn(obj)`.
 *
 * @class
 * @param {Object} obj
 * @param {function(Object): BigInt} fn
 */
class ToPrimitive {
    constructor(obj, fn) {
        this.obj = obj
        this.fn = fn.bind(null, this.obj)
    }

    [Symbol.toPrimitive]() {
        return 1n + this.fn()
    }
}

export default ToPrimitive
