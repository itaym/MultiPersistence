import Store from './store.js'

export default Store

/**
 * Creates a {@link Store}.
 *
 * @param {StoreOptions} options
 * @returns {Store}
 */
export const createStore = options => new Store(options)
