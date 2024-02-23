import { argv } from 'node:process';

const dotenvEval = ({ parsed }) => {
    let env = process.env || {}
    let selfEnv = process.selfEnv || {}

    for (let [key, value] of Object.entries(parsed)) {
        try {   selfEnv[key.toLowerCase()] = eval(value + '') }
        catch { selfEnv[key.toLowerCase()] = value            }
    }
    selfEnv.goal_number = BigInt(selfEnv.base) ** BigInt(selfEnv['goal_power_of10'])

    argv.forEach((val) => {
        const argArr = val.split('=')
        if (argArr[0] === 'base') {
            const base = BigInt(parseInt(argArr[1]))
            try {
                if (base > 1n || base < 65537n) {
                    selfEnv.base = base
                    env.base = base + ''
                }
            }
            catch {}
        }
        if (argArr[0] === 'debug') {
            const debug = eval(argArr[1])
            try {
                if (debug !== undefined) {
                    process.selfEnv.debug = !!debug
                    process.env.debug = !!debug + ''
                }
            }
            catch {}
        }
    })
    process.selfEnv = selfEnv
}
export default dotenvEval