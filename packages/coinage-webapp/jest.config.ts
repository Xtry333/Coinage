/* eslint-disable */
export default {
    displayName: 'coinage-webapp',
    preset: '../../jest.preset.js',
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    globals: {},
    coverageDirectory: '../../coverage/packages/coinage-webapp',
    moduleNameMapper: {
        'ngx-socket-io': '<rootDir>/src/__mocks__/ngx-socket.ts',
    },
    transform: {
        '^.+\\.(ts|mjs|js|html)$': [
            'jest-preset-angular',
            {
                tsConfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.(html|svg)$',
            },
        ],
    },
    transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
    snapshotSerializers: [
        'jest-preset-angular/build/serializers/no-ng-attributes',
        'jest-preset-angular/build/serializers/ng-snapshot',
        'jest-preset-angular/build/serializers/html-comment',
    ],
};
