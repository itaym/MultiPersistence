import memorize from './memorize.js'

const factorialFn = number => {
    if (number <= 1n) return 1n
    return number * factorial(number - 1n)
}

const factorial = memorize(factorialFn, 'factorial')

export default factorial