/**
 * Normalized, evaluated `.env` variables — keys lowercased, values already parsed.
 *
 * @property {BigInt} base - The base used for numeric operations (from BASE)
 * @property {number} cache_idle_save_ms - Idle ms an io store waits before rewriting its file (from CACHE_IDLE_SAVE_MS)
 * @property {number} check_interval_count - Iterations between wall-clock log/checkpoint checks (from CHECK_INTERVAL_COUNT)
 * @property {number} checkpoint_interval - Milliseconds between checkpoint saves (from CHECKPOINT_INTERVAL)
 * @property {boolean} debug - Whether debug mode is enabled (from DEBUG)
 * @property {BigInt} goal_power_of10 - The target power of 10 value (from GOAL_POWER_OF10)
 * @property {BigInt} last_number - The evaluated expression that produces the last number (from LAST_NUMBER)
 * @property {number} log_interval - Interval in milliseconds for logging output (from LOG_INTERVAL)
 * @property {string} memorize_cache_dir - Directory memorize() cache files are read from / written to (from MEMORIZE_CACHE_DIR)
 * @property {string} results_file - Base name of the result files, no extension (from RESULTS_FILE)
 * @typedef {Object} NormalizedEnv
 */

/**
 * Result object returned by digit‑reduction functions.
 *
 * @typedef {Object} ReduceResults
 * @property {BigInt} additionSum sum of all digits (digit * count) in the HugeInt
 * @property {BigInt} multiplySum product of all digits (digit ** count) in the HugeInt
 * @property {number} productLength digit count of the step-1 product (`multiplySum`) in the current base
 * @property {number} steps multiplicative steps performed so far
 */
