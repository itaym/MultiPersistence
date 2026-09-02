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

import fs from 'fs'
import {
    Worker,
    MessageChannel,
    receiveMessageOnPort,
    SHARE_ENV,
} from 'worker_threads'

const WORKER_URL = new URL('./persist.worker.js', import.meta.url)

/**
 * @typedef {Object} StoreOptions
 * @property {string} file        absolute path of the JSON file to persist to
 * @property {string} codecUrl    module URL exporting `serialize([entries])` and
 *                                `deserialize(text)`; imported on both threads
 * @property {number} [idleMs]    idle time before a dirty store is flushed; default 2000
 * @property {boolean} [debug]    when true, never touch the disk (load still runs)
 */

/**
 * A disk-backed key/value store. Usable immediately: until the worker reports
 * the loaded contents, the store simply looks empty and buffers writes, then
 * back-fills the keys it did not already see.
 */
class Store {
    /** id → live Store, for routing worker messages. @type {Map<number, Store>} */
    static #routes = new Map()
    /** @type {Worker | null} */
    static #worker = null
    /** @type {MessagePort | null} */
    static #port = null
    static #nextId = 1
    static #exitHooked = false

    /** Lazily spawn the one shared persist worker. */
    static #ensureWorker() {
        if (Store.#worker) return

        const { port1, port2 } = new MessageChannel()
        Store.#port = port1
        Store.#port.unref()

        Store.#worker = new Worker(WORKER_URL, {
            workerData: { port: port2 },
            transferList: [port2],
            env: SHARE_ENV,
        })
        Store.#worker.unref()
        Store.#worker.on('error', (err) => {
            console.error('io: persist worker error:', err)
        })

        if (!Store.#exitHooked) {
            Store.#exitHooked = true
            process.on('exit', () => {
                for (const store of Store.#routes.values()) store.flushSync()
            })
        }
    }

    /** Drain the shared port and route each message to its owning store. */
    static #drain() {
        if (!Store.#port) return
        let received
        while ((received = receiveMessageOnPort(Store.#port))) {
            const msg = received.message
            Store.#routes.get(msg.id)?.#deliver(msg)
        }
    }

    /** @type {Map<string, *>} */
    #map = new Map()
    #id = Store.#nextId++
    #file
    #debug
    /** @type {{ serialize: Function, deserialize: Function } | null} */
    #codec = null
    #dirty = false
    #loadedReceived = false
    #loadedText = ''
    #ready = false

    /** @param {StoreOptions} options */
    constructor({ file, codecUrl, idleMs = 2000, debug = false }) {
        this.#file = file
        this.#debug = debug

        Store.#ensureWorker()
        Store.#routes.set(this.#id, this)

        import(codecUrl).then((codec) => {
            this.#codec = codec
            this.#applyLoaded()
        }).catch((err) => {
            console.error(`io: failed to import codec ${codecUrl}:`, err)
        })

        Store.#port.postMessage({
            type: 'open',
            id: this.#id,
            file,
            codecUrl,
            idleMs: Number(idleMs) || 2000,
            debug,
        })
    }

    /** Handle one routed message from the worker. */
    #deliver(msg) {
        if (msg.type === 'loaded') {
            this.#loadedReceived = true
            this.#loadedText = msg.text ?? ''
            this.#applyLoaded()
        } else if (msg.type === 'saved') {
            this.#dirty = false
        }
    }

    /** Fold the loaded file into {@link #map} once both it and the codec exist. */
    #applyLoaded() {
        if (this.#ready || !this.#loadedReceived || !this.#codec) return

        let entries = []
        if (this.#loadedText) {
            try {
                entries = this.#codec.deserialize(this.#loadedText) ?? []
            } catch {}
        }
        for (const [key, value] of entries) {
            if (!this.#map.has(key)) this.#map.set(key, value)
        }
        this.#ready = true
    }

    /**
     * @param {string} key
     * @returns {*}
     */
    get(key) {
        Store.#drain()
        return this.#map.get(key)
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        Store.#drain()
        return this.#map.has(key)
    }

    /**
     * @param {string} key
     * @param {*} value
     * @returns {this}
     */
    set(key, value) {
        Store.#drain()
        this.#map.set(key, value)
        this.#dirty = true
        Store.#port.postMessage({ type: 'set', id: this.#id, key, value })
        return this
    }

    get size() {
        Store.#drain()
        return this.#map.size
    }

    /**
     * Best-effort synchronous rewrite of the store file. Runs from the
     * `process` `exit` hook, where the worker can no longer help.
     *
     * @returns {void}
     */
    flushSync() {
        if (this.#debug || !this.#dirty || !this.#codec) return
        try {
            const text = this.#codec.serialize([...this.#map])
            try {
                fs.renameSync(this.#file, `${this.#file}.bak`)
            } catch {}
            fs.writeFileSync(this.#file, text)
            this.#dirty = false
        } catch (err) {
            console.error(`io: exit flush failed for ${this.#file}:`, err)
        }
    }

    /**
     * Ask the worker to flush and forget this store, then flush synchronously
     * here too. Optional — the `exit` hook covers the common case.
     *
     * @returns {void}
     */
    close() {
        Store.#port.postMessage({ type: 'close', id: this.#id })
        this.flushSync()
        Store.#routes.delete(this.#id)
    }
}

/**
 * @param {StoreOptions} options
 * @returns {Store}
 */
export function createStore(options) {
    return new Store(options)
}
