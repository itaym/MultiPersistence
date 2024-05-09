const maxBase = 65536 // process.selfEnv.base || 65536

export const digitsObj = new Map([
    [0n, '0'], [1n, '1'], [2n, '2'], [3n, '3'], [4n, '4'], [5n, '5'], [6n, '6'], [7n, '7'],
    [8n, '8'], [9n, '9'], [10n, 'a'], [11n, 'b'], [12n, 'c'], [13n, 'd'], [14n, 'e'], [15n, 'f'],
    [16n, 'g'], [17n, 'h'], [18n, 'i'], [19n, 'j'], [20n, 'k'], [21n, 'l'], [22n, 'm'], [23n, 'n'],
    [24n, 'o'], [25n, 'p'], [26n, 'q'], [27n, 'r'], [28n, 's'], [29n, 't'], [30n, 'u'], [31n, 'v'],
    [32n, 'w'], [33n, 'x'], [34n, 'y'], [35n, 'z'], [36n, 'A'], [37n, 'B'], [38n, 'C'], [39n, 'D'],
    [40n, 'E'], [41n, 'F'], [42n, 'G'], [43n, 'H'], [44n, 'I'], [45n, 'j'], [46n, 'K'], [47n, 'L'],
    [48n, 'M'], [49n, 'N'], [50n, 'O'], [51n, 'P'], [52n, 'Q'], [53n, 'R'], [54n, 'S'], [55n, 'T'],
    [56n, 'U'], [57n, 'V'], [58n, 'W'], [59n, 'X'], [60n, 'Y'], [61n, 'Z'], [62n, '+'], [63n, '/'],
])
export const digitsValue = {
    '0': 0n, '1': 1n, '2': 2n, '3': 3n, '4': 4n, '5': 5n, '6': 6n, '7': 7n,
    '8': 8n, '9': 9n, 'a': 10n, 'b': 11n, 'c': 12n, 'd': 13n, 'e': 14n, 'f': 15n,
    'g': 16n, 'h': 17n, 'i': 18n, 'j': 19n, 'k': 20n, 'l': 21n, 'm': 22n, 'n': 23n,
    'o': 24n, 'p': 25n, 'q': 26n, 'r': 27n, 's': 28n, 't': 29n, 'u': 30n, 'v': 31n,
    'w': 32n, 'x': 33n, 'y': 34n, 'z': 35n, 'A': 36n, 'B': 37n, 'C': 38n, 'D': 39n,
    'E': 40n, 'F': 41n, 'G': 42n, 'H': 43n, 'I': 44n, 'J': 45n, 'K': 46n, 'L': 47n,
    'M': 48n, 'N': 49n, 'O': 50n, 'P': 51n, 'Q': 52n, 'R': 53n, 'S': 54n, 'T': 55n,
    'U': 56n, 'V': 57n, 'W': 58n, 'X': 59n, 'Y': 60n, 'Z': 61n, '+': 62n, '/': 63n,
}
if (maxBase > 64) {
    let offset = 0n
    for (let x = 0n; x < maxBase + 64; x++) {

        let char = String.fromCharCode(Number(x))
        if (digitsValue[char] !== undefined) {
            offset++
            continue
        }

        digitsObj.set(x + 64n - offset, char)
        digitsValue[char] = x + 64n - offset
    }
}

export const  toBigInt = new Array(2_000)
for (let int = 0; int < 2_000; int++) {
    toBigInt[int] = BigInt(int)
}
export const toNumber = new Array(2_000).fill(0).map((_, index) => index)
