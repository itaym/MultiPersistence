/**
 * Persist worker: the off-thread half of {@link module:io}.
 *
 * One instance per realm, handling every store. For each `open` it loads the
 * file, holds its own copy of the data, folds in every `set` the client sends,
 * and rewrites the whole file once `idleMs` has passed with no further writes.
 * Flushes on `flush` and on `close`.
 *
 * All traffic runs over the {@link MessagePort} handed in through `workerData`
 * (not `parentPort`) so the client can drain it synchronously with
 * `receiveMessageOnPort` — this project's main thread never yields to its own
 * event loop, so it cannot receive messages any other way. Every message
 * carries a numeric store `id`.
 *
 * @module io/persist.worker
 */

import fs from 'fs/promises'
import { workerData } from 'worker_threads'

/** @type {MessagePort} */
const { port } = workerData

/**
 * @typedef {Object} StoreState
 * @property {Map<string, *>} map
 * @property {string} file
 * @property {number} idleMs
 * @property {boolean} debug
 * @property {{ serialize: Function, deserialize: Function } | null} codec
 * @property {NodeJS.Timeout | null} idleTimer
 * @property {boolean} writing
 * @property {boolean} dirtyWhileWriting
 */

/** id → per-store state. @type {Map<number, StoreState>} */
const stores = new Map()

/** Cache of imported codec modules, keyed by URL. @type {Map<string, Promise<*>>} */
const codecs = new Map()
const loadCodec = (url) => {
    let pending = codecs.get(url)
    if (!pending) {
        pending = import(url)
        codecs.set(url, pending)
    }
    return pending
}

/**
 * Reads a store's file (falling back to its `.bak`), seeds its map with any
 * keys not already set by an early `set`, and reports the raw text back so the
 * client can seed its own view.
 *
 * @param {number} id
 * @param {StoreState} state
 * @returns {Promise<void>}
 */
const load = async (id, state) => {
    let text = null
    try {
        text = await fs.readFile(state.file, 'utf8')
    } catch {
        try {
            text = await fs.readFile(`${state.file}.bak`, 'utf8')
        } catch {}
    }

    if (text && state.codec) {
        try {
            for (const [key, value] of state.codec.deserialize(text) ?? []) {
                if (!state.map.has(key)) state.map.set(key, value)
            }
        } catch {}
    }

    port.postMessage({ type: 'loaded', id, text })
}

/**
 * Rewrites a store's file: rename the current file to `.bak`, then write the
 * fresh JSON. Coalesces writes that land while one is already in flight.
 *
 * @param {number} id
 * @param {StoreState} state
 * @returns {Promise<void>}
 */
const save = async (id, state) => {
    if (state.debug || !state.codec) return
    if (state.writing) {
        state.dirtyWhileWriting = true
        return
    }

    state.writing = true
    try {
        const text = state.codec.serialize([...state.map])
        try {
            await fs.rename(state.file, `${state.file}.bak`)
        } catch {}
        await fs.writeFile(state.file, text)
        port.postMessage({ type: 'saved', id })
    } catch (err) {
        console.error(`io persist worker: save failed for ${state.file}:`, err)
    } finally {
        state.writing = false
        if (state.dirtyWhileWriting) {
            state.dirtyWhileWriting = false
            scheduleSave(id, state)
        }
    }
}

/** (Re)arms a store's idle timer; the pending write slides out to the last `set`. */
const scheduleSave = (id, state) => {
    if (state.idleTimer) clearTimeout(state.idleTimer)
    state.idleTimer = setTimeout(() => save(id, state), state.idleMs)
}

port.on('message', (msg) => {
    const state = stores.get(msg.id)

    switch (msg.type) {
        case 'open': {
            if (stores.has(msg.id)) break
            /** @type {StoreState} */
            const fresh = {
                map: new Map(),
                file: msg.file,
                idleMs: msg.idleMs,
                debug: msg.debug,
                codec: null,
                idleTimer: null,
                writing: false,
                dirtyWhileWriting: false,
            }
            stores.set(msg.id, fresh)
            loadCodec(msg.codecUrl).then((codec) => {
                fresh.codec = codec
                return load(msg.id, fresh)
            }).catch((err) => {
                console.error(`io persist worker: codec load failed for ${msg.file}:`, err)
                port.postMessage({ type: 'loaded', id: msg.id, text: null })
            })
            break
        }

        case 'set':
            if (!state) break
            state.map.set(msg.key, msg.value)
            scheduleSave(msg.id, state)
            break

        case 'flush':
            if (!state) break
            if (state.idleTimer) clearTimeout(state.idleTimer)
            save(msg.id, state).then()
            break

        case 'close':
            if (!state) break
            if (state.idleTimer) clearTimeout(state.idleTimer)
            save(msg.id, state).finally(() => stores.delete(msg.id))
            break
    }
})
