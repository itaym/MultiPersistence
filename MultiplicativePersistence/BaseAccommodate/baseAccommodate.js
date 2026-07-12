/**
 * Base Accommodation Module
 *
 * This module selects and returns a base-specific optimization function
 * depending on the normalized environment base. Each supported base has its
 * own specialized implementation (e.g., base00006, base00008, base00010, etc.)
 * which may include pruning rules, digit heuristics, or structural adjustments
 * tailored for multiplicative persistence search.
 *
 * The module also attaches additional helper methods to HugeInt's prototype
 * when needed (e.g., `cTCNFC`), enabling base-specific optimizations to access
 * HugeInt internals without repeatedly importing or binding utilities.
 *
 * If the current base is not supported, a no-op function (`emptyFunction`)
 * is returned to ensure consistent behavior without breaking the search loop.
 */

import { emptyFunction } from "./utils.js";
import HugeInt from '../../HugeInt/index.js'

import { base00006 } from "./base00006.js";
import { base00008 } from "./base00008.js";
import { base00009 } from "./base00009.js";
import { base00010 } from "./base00010.js";
import { base00014 } from "./base00014.js";
import { base00012 } from "./base00012.js";
import { base00015 } from "./base00015.js";
import { base00016 } from "./base00016.js";

/**
 * Selects and returns the base-specific accommodation function.
 *
 * Behavior:
 *  - Extends HugeInt.prototype with additional helper methods required by
 *    certain base-specific modules (e.g., `countTwoComponentsNoFirstCell`).
 *  - Determines the active base using `process.normalizedEnv.base`.
 *  - Returns the corresponding optimization module for that base.
 *  - If the base is unsupported, returns a no-op function.
 *  - Adds a `supported` property to the returned function, listing all bases
 *    for which accommodation modules exist.
 *
 * Purpose:
 *  - Allows the persistence search engine to dynamically load specialized
 *    pruning and optimization logic depending on the numerical base.
 *  - Keeps base-specific logic isolated and modular.
 *
 * @returns {Function}
 *     A function implementing base-specific optimization logic, or a no-op
 *     function if the base is unsupported.
 */
const functionToExport = () => {
    /**
     * Extends HugeInt with `cTCNFC`, an alias for
     * `countTwoComponentsNoFirstCell`, enabling base-specific modules to use
     * this helper without importing HugeInt directly.
     *
     * @property {Function} HugeInt.prototype.cTCNFC
     *     Counts digit-component pairs excluding the first cell.
     */
    HugeInt.prototype.cTCNFC = HugeInt.prototype.countTwoComponentsNoFirstCell

    let fn
    /**
     * Base selection switch:
     *  - Maps normalized base values to their corresponding optimization modules.
     *  - Each module implements heuristics or pruning rules tailored for that base.
     *
     * Supported bases:
     *  - 6, 8, 9, 10, 12, 14, 15, 16
     *
     * Unsupported bases:
     *  - Any base not listed above defaults to `emptyFunction`.
     */
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

    /**
     * List of all bases for which accommodation modules exist.
     *
     * @type {Array<bigint>}
     */
    fn.supported = [
        6n, 8n, 9n, 10n, 12n, 14n, 15n, 16n,
    ]
    return fn
}

export default functionToExport()
