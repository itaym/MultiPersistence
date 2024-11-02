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
