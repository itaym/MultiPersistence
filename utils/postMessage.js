import sleep from './sleep.js'

/**
 *
 * @param worker { Worker }
 * @param type { string }
 * @param data { Object }
 * @returns { boolean }
 */
const postMessage = (worker, type, data) => {

    if (type === 'init')
        process.env.isWorkerReady = 'true'
try {
    if (process.env.isWorkerReady === 'true') {
        process.env.isWorkerReady = 'false'
        worker.postMessage({
                type,
                data,
            }
        )
        //await sleep(1)
        return true
    }
}catch(e){
        debugger
}
    return false
}

export default postMessage