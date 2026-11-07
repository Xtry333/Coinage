import baseConfig from '../../eslint.config.mjs';

export default [
    ...baseConfig,
    {
        settings: {
            'import/resolver': {
                typescript: { project: `${import.meta.dirname}/tsconfig.spec.json` },
            },
        },
    },
];
