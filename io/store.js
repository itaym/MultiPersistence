import fs from 'node:fs'
import {
    MessageChannel,
    receiveMessageOnPort,
    SHARE_ENV,
    Worker,
} from 'node:worker_threads'

/** @type {URL} */
const WORKER_URL = new URL('./persist.worker.js', import.meta.url)

/** Map mirrored to a JSON file by the shared persist worker; reads are sync, writes are debounced. */
class Store {
    /**
     * @param {StoreOptions} options
     */
    constructor({ codecUrl, debug = false, file, idleMs = 2000 }) {
        this.#file = file
        this.#debug = debug

        Store.#ensureWorker()
        Store.#routes.set(this.#id, this)

        import(codecUrl).then(codec => {
            this.#codec = codec
            this.#applyLoaded()
        }).catch(err => {
            // eslint-disable-next-line no-console
            console.error(`io: failed to import codec ${codecUrl}:`, err)
        })

        Store.#port.postMessage({
            codecUrl,
            debug,
            file,
            id: this.#id,
            idleMs: Number(idleMs) || 2000,
            type: 'open',
        })
    }

    /** @type {Codec|null} */
    #codec = null
    /** @type {boolean} */
    #debug
    /** @type {boolean} unsaved changes */
    #dirty = false
    /** @type {boolean} */
    static #exitHooked = false
    /** @type {string} */
    #file

    /** @type {number} */
    static #nextId = 1

    /** @type {number} */
    #id = Store.#nextId++

    /** @type {boolean} */
    #loadedReceived = false
    /** @type {string} */
    #loadedText = ''
    /** @type {Map<*, *>} */
    #map = new Map()
    /** @type {MessagePort|null} */
    static #port = null
    /** @type {boolean} loaded entries merged in */
    #ready = false
    /** @type {Map<number, Store>} store id → store, for routing worker messages */
    static #routes = new Map()
    /** @type {Worker|null} */
    static #worker = null
    /**
     * Starts the shared persist worker once and flushes every store on exit.
     *
     * @returns {void}
     */
    static #ensureWorker() {
        if (Store.#worker) return

        const { port1, port2 } = new MessageChannel()
        Store.#port = port1
        Store.#port.unref()

        Store.#worker = new Worker(WORKER_URL, {
            env: SHARE_ENV,
            transferList: [port2],
            workerData: { port: port2 },
        })
        Store.#worker.unref()
        Store.#worker.on('error', err => {
            // eslint-disable-next-line no-console
            console.error('io: persist worker error:', err)
        })

        if (!Store.#exitHooked) {
            Store.#exitHooked = true
            process.on('exit', () => {
                for (const store of Store.#routes.values()) store.flushSync()
            })
        }
    }

    /**
     * Delivers every pending worker message to its store.
     *
     * @returns {void}
     */
    static #drain() {
        if (!Store.#port) return
        let received
        while ((received = receiveMessageOnPort(Store.#port))) {
            const msg = received.message
            Store.#routes.get(msg.id)?.#deliver(msg)
        }
    }

    /**
     * Handles one routed worker message.
     *
     * @param {StoreWorkerMessage} msg
     * @returns {void}
     */
    #deliver(msg) {
        if (msg.type === 'loaded') {
            this.#loadedReceived = true
            this.#loadedText = msg.text ?? ''
            this.#applyLoaded()
        } else if (msg.type === 'saved') {
            this.#dirty = false
        }
    }

    /**
     * Merges the loaded file into the map once both it and the codec are there.
     *
     * @returns {void}
     */
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
     * @param {*} key
     * @returns {*}
     */
    get(key) {
        Store.#drain()
        return this.#map.get(key)
    }

    /**
     * @param {*} key
     * @returns {boolean}
     */
    has(key) {
        Store.#drain()
        return this.#map.has(key)
    }

    /**
     * Sets `key` and tells the worker to save.
     *
     * @param {*} key
     * @param {*} value
     * @returns {this}
     */
    set(key, value) {
        Store.#drain()
        this.#map.set(key, value)
        this.#dirty = true
        Store.#port.postMessage({ id: this.#id, key, type: 'set', value })
        return this
    }

    /** @returns {number} */
    get size() {
        Store.#drain()
        return this.#map.size
    }

    /**
     * Writes the map to disk synchronously when dirty.
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
            // eslint-disable-next-line no-console
            console.error(`io: exit flush failed for ${this.#file}:`, err)
        }
    }

    /**
     * Closes the store, flushing it first.
     *
     * @returns {void}
     */
    close() {
        Store.#port.postMessage({ id: this.#id, type: 'close' })
        this.flushSync()
        Store.#routes.delete(this.#id)
    }
}

export default Store
