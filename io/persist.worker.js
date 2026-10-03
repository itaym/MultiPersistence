/** Persist worker: keeps one Map per store, loads it from disk and writes it back when idle. */
import fs from 'node:fs/promises'
import { workerData } from 'node:worker_threads'

/** @type {MessagePort} channel to the main thread */
const { port } = workerData

/** @type {Map<number, StoreState>} store id → state */
const stores = new Map()

/** @type {Map<string, Promise<*>>} codec module URL → import */
const codecs = new Map()

/**
 * Imports the codec module at `url` once.
 *
 * @param {string} url
 * @returns {Promise<*>}
 */
const loadCodec = url => {
    let pending = codecs.get(url)
    if (!pending) {
        pending = import(url)
        codecs.set(url, pending)
    }
    return pending
}

/**
 * Reads the store file (or its `.bak`), merges it into the map, and reports `loaded` with the raw text.
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

    port.postMessage({ id, text, type: 'loaded' })
}

/**
 * Writes the map to disk, keeping the previous file as `.bak`; reschedules if it changed meanwhile.
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
        port.postMessage({ id, type: 'saved' })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`io persist worker: save failed for ${state.file}:`, err)
    } finally {
        state.writing = false
        if (state.dirtyWhileWriting) {
            state.dirtyWhileWriting = false
            scheduleSave(id, state)
        }
    }
}

/**
 * Re|rms the store's idle timer, so write happens `idleMs` after the last `set`.
 *
 * @param {number} id
 * @param {StoreState} state
 * @returns {void}
 */
const scheduleSave = (id, state) => {
    if (state.idleTimer) clearTimeout(state.idleTimer)
    state.idleTimer = /** @type {NodeJS.Timeout|null} */ setTimeout(() => save(id, state), state.idleMs)
}

port.on('message', msg => {
    const state = stores.get(msg.id)

    // eslint-disable-next-line default-case
    switch (msg.type) {
        case 'open': {
            if (stores.has(msg.id)) break
            /** @type {StoreState} */
            const fresh = {
                codec: null,
                debug: msg.debug,
                dirtyWhileWriting: false,
                file: msg.file,
                idleMs: msg.idleMs,
                idleTimer: null,
                map: new Map(),
                writing: false,
            }
            stores.set(msg.id, fresh)
            loadCodec(msg.codecUrl).then(codec => {
                fresh.codec = codec
                return load(msg.id, fresh)
            }).catch(err => {
                // eslint-disable-next-line no-console
                console.error(`io persist worker: codec load failed for ${msg.file}:`, err)
                port.postMessage({ id: msg.id, text: null, type: 'loaded' })
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
