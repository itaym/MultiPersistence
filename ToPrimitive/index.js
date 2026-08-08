/**
 * Wrapper class that provides a custom primitive conversion for an object.
 *
 * `ToPrimitive` binds a provided function to the given object and exposes a
 * `Symbol.toPrimitive` method so that the instance can participate in numeric
 * operations. When JavaScript attempts to convert the instance to a primitive,
 * it returns:
 *
 *     1n + fn(obj)
 *
 * This is useful when you want an object to behave like a BigInt in arithmetic
 * expressions while still carrying structured data.
 *
 * @class
 *
 * @param {Object} obj
 *     The object to wrap and pass into the bound function.
 *
 * @param {function(Object): BigInt} fn
 *     A function that receives `obj` and returns a BigInt. It is bound to `obj`
 *     during construction.
 *
 * @example
 * const t = new ToPrimitive(myObj, o => o.value);
 * const x = 5n + t;   // invokes Symbol.toPrimitive → 5n + (1n + fn(obj))
 */

class ToPrimitive {
    constructor(obj, fn) {
        this.obj = obj
        this.fn = fn.bind(null, this.obj)
    }
    [Symbol.toPrimitive]() {
        return 1n + this.fn();
    }
}
export default ToPrimitive
