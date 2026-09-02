/**
 * Represents the normalized and evaluated environment variables loaded from the `.env` file.
 *
 * All keys in this object are converted to lowercase, and each value reflects the final
 * processed result after parsing, evaluation, and normalization. This provides a consistent
 * and predictable structure for accessing configuration values throughout the application.
 *
 * @property {BigInt} base - The base used for numeric operations (from BASE)
 * @property {number} cache_idle_save_ms - Idle ms an io store waits before rewriting its file (from CACHE_IDLE_SAVE_MS)
 * @property {boolean} debug - Whether debug mode is enabled (from DEBUG)
 * @property {BigInt} goal_power_of10 - The target power of 10 value (from GOAL_POWER_OF10)
 * @property {BigInt} last_number - The evaluated expression that produces the last number (from LAST_NUMBER)
 * @property {number} log_interval - Interval in milliseconds for logging output (from LOG_INTERVAL)
 * @property {string} memorize_cache_dir - Directory memorize() cache files are read from / written to (from MEMORIZE_CACHE_DIR)
 * @property {string} vars_file - Path to the variables file (from VARS_FILE)
 * @typedef {Object} NormalizedEnv
 */

/**
 * Result object returned by digit‑reduction functions.
 *
 * @typedef {Object} ReduceResults
 * @property {BigInt} additionSum - Sum of all digits (digit * count) in the HugeInt.
 * @property {BigInt} multiplySum - Product of all digits (digit ** count) in the HugeInt.
 *
 * @property {number} steps - Number of multiplicative steps performed so far.
 */
