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
            'guard-for-in': 'off',
            'no-nested-ternary': 'off',
            'no-param-reassign': 'off',
            // until @glorification/eslint-config 0.1.2
            'no-restricted-syntax': ['error',
                {
                    message: 'Define it first, then `export default name` at the end.',
                    selector: 'ExportDefaultDeclaration > ' +
                        ':matches(ClassDeclaration, FunctionDeclaration, NewExpression)',
                },
                {
                    message: 'No `= undefined` defaults: give the real default or none.',
                    selector: 'AssignmentPattern > Identifier.right[name="undefined"]',
                },
                {
                    message: 'Check the flag itself: `if (flag)`.',
                    selector: 'IfStatement > BinaryExpression.test[operator="==="] > Literal.right[raw="true"]',
                },
            ],
            'no-return-assign': 'off',
            'no-sequences': 'off',
            // until @glorification/eslint-config 0.1.2
            'unicorn/numeric-separators-style': ['error', {
                binary: { onlyIfContainsSeparator: true },
                hexadecimal: { onlyIfContainsSeparator: true },
                number: { groupLength: 3, minimumDigits: 5 },
                octal: { onlyIfContainsSeparator: true },
                onlyIfContainsSeparator: false,
            }],
        },
    },
    {
        files: ['**/*.test.js', 'SegmentsIntegrationTest/**', 'test.js', 'testPerformances/**'],
        rules: {
            'no-console': 'off',
        },
    },
]
