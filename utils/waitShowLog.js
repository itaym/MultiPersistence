import gaySchluffen from './sleep.js'

/**
 *
 * @return {Promise<void>}
 */
const waitShowLog = async () => {
    while (process.env.isWorkerReady !== 'true') {
        process.stdout.write(".")
        await gaySchluffen(20)
    }
    console.log(`\n${process.env.log}`)
}

export default waitShowLog