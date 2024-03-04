import { promises as fs } from 'fs'

const reviver = (key, value) => {
    switch (key) {
        case 'base':
        case 'calculated':
        case 'combinations':
        case 'first':
        case 'iteration':
        case 'last':
        case 'last_number':
            return BigInt(value)
    }
    return value
}

export const getInitVars = async () => {

    const { env, selfEnv } = process
    const { vars_file } = env
    const fileName = `./results/${selfEnv.base.toString().padStart(5, '0')}_${vars_file}`

    const defaultVars = {
        base: eval(env.base),
        iterations: {
            calculated: 0n,
            count: 0,
            found_nothing: 0,
            found_nothing_break_at: 10_000_000,
        },
        last_number: eval(env.last_number),
        number_lengths: {},
        up_time: 0,
        steps: [],
    }
    if (env.debug === 'true') return defaultVars
    try {
        let data = await fs.readFile(fileName, 'utf-8')
        data = JSON.parse(data, reviver)
        return data
    } catch {}
    return defaultVars
}

const replacer = (key, value) => {
    const name = value?.constructor?.name
    if (name === 'BigInt') {
        return value.toString()
    }
    if (name === 'HugeInt') {
        return value.value.toString()
    }
    return value
}

export const setInitVars = async (initVars, base) => {
    const fileName = `./results/${base.toString().padStart(5, '0')}_${process.env.vars_file}`
    await fs.writeFile(fileName, JSON.stringify(initVars, replacer, '\t'))
}