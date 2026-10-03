import glorification from '@glorification/eslint-config'
import aliases from '@glorification/eslint-config/aliases'
import jsdoc from '@glorification/eslint-config/jsdoc'
import sorting from '@glorification/eslint-config/sorting'

export default [
    {
        ignores: ['caching/**', 'results/**'],
    },
    ...glorification,
    ...aliases,
    ...jsdoc,
    ...sorting,
    {
        rules: {
            'no-param-reassign': 'off',
        },
    },
    {
        files: ['**/*.test.js', 'SegmentsIntegrationTest/**', 'test.js', 'testPerformances/**'],
        rules: {
            'no-console': 'off',
        },
    },
]
