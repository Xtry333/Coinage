import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
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
    globalIgnores(['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.nx/**', '**/.angular/**']),
    {
        files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
        extends: fixupConfigRules(compat.extends('plugin:import/recommended', 'plugin:import/typescript', 'prettier')),

        plugins: {
            '@nx': nx,
            '@stylistic': stylistic,
            import: fixupPluginRules(_import),
        },

        settings: {
            'import/resolver': {
                typescript: {
                    project: path.join(__dirname, 'tsconfig.base.json'),
                },
            },
        },

        rules: {
            '@stylistic/no-extra-semi': 'error',
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
            'no-extra-semi': 'off',
        },
    },
    {
        files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
        extends: compat.extends('plugin:@nx/javascript'),

        rules: {
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
            // Keep pre-upgrade policy; these newly enabled preset rules require unrelated source refactors.
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'off',
        },
    },
    {
        files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
        // Newly enabled preset defaults, not rules explicitly selected by this workspace.
        rules: { 'prefer-const': 'off', 'no-empty': 'off' },
    },
]);
