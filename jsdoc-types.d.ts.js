/**
 * Represents the normalized and evaluated environment variables loaded from the `.env` file.
 *
 * All keys in this object are converted to lowercase, and each value reflects the final
 * processed result after parsing, evaluation, and normalization. This provides a consistent
 * and predictable structure for accessing configuration values throughout the application.
 *
 * @typedef {Object} NormalizedEnv
 * @property {string} base - The base used for numeric operations (from BASE)
 * @property {string} goal_power_of10 - The target power of 10 value (from GOAL_POWER_OF10)
 * @property {string} last_number - The evaluated expression that produces the last number (from LAST_NUMBER)
 * @property {string} log_interval - Interval in milliseconds for logging output (from LOG_INTERVAL)
 * @property {string} vars_file - Path to the variables file (from VARS_FILE)
 * @property {string} memorize_save_bach - Number of items to batch before saving (from MEMORIZE_SAVE_BACH)
 * @property {string} debug - Whether debug mode is enabled (from DEBUG)
 */
