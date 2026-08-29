/**
 * Wraps an object and provides a custom primitive conversion.
 *
 * When converted to a primitive, returns `1n + fn(obj)`.
 *
 * @class
 *
 * @param {Object} obj
 *     Object to wrap.
 *
 * @param {function(Object): BigInt} fn
 *     Function returning a BigInt based on the object.
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
