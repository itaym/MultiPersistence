import countPer from '../../permutations/countPermutations.js'
import memorize from '../../utils/memorize.js'
import HugeInt from '../../HugeInt/index.js'

import { base00006 } from "./base00006.js";
import { base00008 } from "./base00008.js";
import { base00009 } from "./base00009.js";
import { base00010 } from "./base00010.js";
import { base00014 } from "./base00014.js";
import { base00012 } from "./base00012.js";
import { base00015 } from "./base00015.js";
import { base00016 } from "./base00016.js";

export const splitAfterCell = (hugeInt, cell, countToLeave) => {
    const newCell = hugeInt.splitCellBefore(cell ,cell.count - countToLeave)
    newCell.digit++
}

export const getPermutations = memorize((digit, countChange, base) => {
    if (countChange === 1n) return 1n
    return countPer(countChange - 1n, base - digit) -
        countPer(countChange - 2n, base - digit)
}, 'getPermutations')

export const emptyFunction = () => 0n


const functionToExport = () => {
    HugeInt.prototype.cTCNFC = HugeInt.prototype.countTwoComponentsNoFirstCell
    let fn
    switch (process.normalizedEnv.base) {
        case 6n:
            fn = base00006
            break
        case 8n:
            fn = base00008
            break
        case 9n:
            fn = base00009
            break
        case 10n:
            fn = base00010
            break
        case 12n:
            fn = base00012
            break
        case 14n:
            fn = base00014
            break
        case 15n:
            fn = base00015
            break
        case 16n:
            fn = base00016
            break
        default:
            fn = emptyFunction
    }
    fn.supported = [
        6n, 8n, 9n, 10n, 12n, 14n, 15n, 16n,
    ]
    return fn
}

export default functionToExport()
