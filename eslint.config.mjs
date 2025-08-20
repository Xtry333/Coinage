import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import _import from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores(['**/*']),
    {
        extends: fixupConfigRules(compat.extends('plugin:import/recommended', 'plugin:import/typescript', 'prettier')),

        plugins: {
            '@nx': nx,
            import: fixupPluginRules(_import),
        },

        settings: {
            'import/resolver': {
                typescript: {
                    project: './tsconfig.json',
                },
            },
        },

        rules: {
            'import/no-unresolved': 'error',

            'import/order': [
                'warn',
                {
                    groups: ['builtin', 'external', 'internal', ['sibling', 'parent'], 'index', 'unknown'],

                    'newlines-between': 'always',

                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],

        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    enforceBuildableLibDependency: true,
                    allow: [],

                    depConstraints: [
                        {
                            sourceTag: '*',
                            onlyDependOnLibsWithTags: ['*'],
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: compat.extends('plugin:@nx/typescript'),

        rules: {
            '@typescript-eslint/no-extra-semi': 'error',
            'no-extra-semi': 'off',
        },
    },
    {
        files: ['**/*.js', '**/*.jsx'],
        extends: compat.extends('plugin:@nx/javascript'),

        rules: {
            '@typescript-eslint/no-extra-semi': 'error',
            'no-extra-semi': 'off',
        },
    },
    {
        files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],

        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },

        rules: {},
    },
    {
        files: ['**/*.ts', '**/*.tsx'],

        rules: {
            '@typescript-eslint/explicit-member-accessibility': ['warn'],
        },
    },
]);
