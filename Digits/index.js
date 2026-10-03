import memorize from '#utils/memorize.js'
import { sanitize } from '#utils/stringsUtils.js'

/** @type {number} highest base the digit maps cover */
const MAX_BASE = 65_536

/** @type {Map<bigint, string>} digit value → character */
export const digitsObj = new Map([
    [0n, '0'], [1n, '1'], [2n, '2'], [3n, '3'], [4n, '4'], [5n, '5'], [6n, '6'], [7n, '7'],
    [8n, '8'], [9n, '9'], [10n, 'a'], [11n, 'b'], [12n, 'c'], [13n, 'd'], [14n, 'e'], [15n, 'f'],
    [16n, 'g'], [17n, 'h'], [18n, 'i'], [19n, 'j'], [20n, 'k'], [21n, 'l'], [22n, 'm'], [23n, 'n'],
    [24n, 'o'], [25n, 'p'], [26n, 'q'], [27n, 'r'], [28n, 's'], [29n, 't'], [30n, 'u'], [31n, 'v'],
    [32n, 'w'], [33n, 'x'], [34n, 'y'], [35n, 'z'], [36n, 'A'], [37n, 'B'], [38n, 'C'], [39n, 'D'],
    [40n, 'E'], [41n, 'F'], [42n, 'G'], [43n, 'H'], [44n, 'I'], [45n, 'J'], [46n, 'K'], [47n, 'L'],
    [48n, 'M'], [49n, 'N'], [50n, 'O'], [51n, 'P'], [52n, 'Q'], [53n, 'R'], [54n, 'S'], [55n, 'T'],
    [56n, 'U'], [57n, 'V'], [58n, 'W'], [59n, 'X'], [60n, 'Y'], [61n, 'Z'], [62n, '+'], [63n, '/'],
])

/** @type {Object<string, bigint>} character → digit value */

export const digitsValue = {
    /* eslint-disable @stylistic/object-property-newline */
    '/': 63n, '+': 62n, 0: 0n, 1: 1n, 2: 2n, 3: 3n, 4: 4n, 5: 5n,
    6: 6n, 7: 7n, 8: 8n, 9: 9n, a: 10n, A: 36n, b: 11n, B: 37n,
    c: 12n, C: 38n, d: 13n, D: 39n, e: 14n, E: 40n, f: 15n, F: 41n,
    g: 16n, G: 42n, h: 17n, H: 43n, i: 18n, I: 44n, j: 19n, J: 45n,
    k: 20n, K: 46n, l: 21n, L: 47n, m: 22n, M: 48n, n: 23n, N: 49n,
    o: 24n, O: 50n, p: 25n, P: 51n, q: 26n, Q: 52n, r: 27n, R: 53n,
    s: 28n, S: 54n, t: 29n, T: 55n, u: 30n, U: 56n, v: 31n, V: 57n,
    w: 32n, W: 58n, x: 33n, X: 59n, y: 34n, Y: 60n, z: 35n, Z: 61n,
}

// extend the digit maps for bases greater than 64
if (MAX_BASE > 64) {
    let offset = 0n
    for (let x = 0n; x < MAX_BASE + 64; x++) {
        const char = String.fromCharCode(Number(x))
        if (digitsValue[char] !== undefined) {
            offset++
            continue
        }

        digitsObj.set(x + 64n - offset, char)
        digitsValue[char] = x + 64n - offset
    }
}

/**
 * Sanitized string of the first `base` digit characters; disk-memorized.
 *
 * @type {(base: bigint) => string}
 */
export const baseDigits = memorize(
    base => {
        let digitsString = ''

        for (let digit = 0n; digit < base; digit++) {
            digitsString += digitsObj.get(digit)
        }

        return sanitize(digitsString)
    },
    'baseDigits',
)

/** @type {bigint[]} */
const _toBigInt = new Array(10_000)

for (let int = 0; int < _toBigInt.length; int++) {
    _toBigInt[int] = BigInt(int)
}

/** @type {bigint[]} `BigInt(i)` for `i` below 10,000 */
export const toBigInt = _toBigInt
