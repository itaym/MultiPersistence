/**
 * `io` — a tiny disk-backed key/value store that accumulates writes in memory
 * and persists them off-thread.
 *
 * Every {@link createStore} shares **one** {@link module:io/persist.worker}
 * thread per realm: it owns each file, folds in every write, and rewrites the
 * file after a quiet period (`idleMs`). The client side keeps its own `Map` for
 * synchronous `get`/`has` and, as a last-resort safety net, writes the file
 * itself synchronously on `process` exit.
 *
 * Built for this project's constraint that the main thread never yields to its
 * event loop: the client talks to the worker over a {@link MessagePort} it
 * drains with `receiveMessageOnPort` on every call — no `'message'` listener,
 * no `await`. Messages are tagged with a numeric store `id` and routed back to
 * the owning {@link Store}.
 *
 * `memorize` is the first consumer; the data model is deliberately generic so
 * other accumulating structures can use it later.
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
