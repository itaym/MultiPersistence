/**
 * `io` — a disk-backed key/value store that accumulates writes in memory and persists them
 * off-thread. One {@link module:io/persist.worker} per realm owns each file and rewrites it
 * after `idleMs` of quiet; the client keeps a `Map` for synchronous `get`/`has` and flushes
 * synchronously on `process` exit. The client never `await`s — it drains the worker's
 * {@link MessagePort} with `receiveMessageOnPort` on each call.
 *
 * @module io
 */

import { Store } from './store.js'

export { Store } from './store.js'

/**
 * @param {import('./store.js').StoreOptions} options
 * @returns {Store}
 */
export function createStore(options) {
    return new Store(options)
}
