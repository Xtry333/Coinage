import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Script } from 'node:vm';

import { DataSource } from 'typeorm';
import { ModuleKind, transpileModule } from 'typescript';

import { getPostgresConnectionOptions } from './postgres-connection-options';
import { dataSource, loadMigrations, opts } from './typeorm.config';

describe('loadMigrations', () => {
    describe('ts-node context (require.context unavailable)', () => {
        it('returns two glob pattern strings (one for .ts, one for .js)', () => {
            const result = loadMigrations();

            expect(result).toHaveLength(2);
            expect(result.every((r) => typeof r === 'string')).toBe(true);
        });

        it('glob patterns target timestamp-prefixed migration files', () => {
            const [tsPattern, jsPattern] = loadMigrations() as string[];

            expect(tsPattern).toMatch(/\[0-9\]\*.*\.ts$/);
            expect(jsPattern).toMatch(/\[0-9\]\*.*\.js$/);
        });
    });

    describe('webpack context (__webpack_require__ present)', () => {
        function withWebpackContext(mockContext: jest.Mock, fn: (load: typeof loadMigrations) => void): void {
            // Jest gives every module its own require function. Evaluate the config with
            // a module-local webpack require instead of patching this test's require.
            const filename = join(__dirname, 'typeorm.config.ts');
            const { outputText } = transpileModule(readFileSync(filename, 'utf8'), {
                compilerOptions: { module: ModuleKind.CommonJS },
            });
            const context = {
                exports: {},
                require: Object.assign((id: string) => require(id), { context: jest.fn(() => mockContext) }),
                __dirname,
                __webpack_require__: {},
            };
            new Script(outputText, { filename }).runInNewContext(context);
            fn((context.exports as typeof import('./typeorm.config')).loadMigrations);

            expect(context.require.context).toHaveBeenCalledWith(
                '../database/migrations',
                false,
                expect.objectContaining({ source: /^\.\/(\d+\S*)\.(ts|js)$/.source }),
            );
        }

        it('returns constructor functions extracted from each matched module', () => {
            class Migration1 {}

            const moduleMap: Record<string, Record<string, unknown>> = {
                './20261015000000-BaselinePostgres.ts': { Migration1, notAMigration: 'ignore this export' },
            };

            const mockContext = jest.fn((key: string) => moduleMap[key]);
            Object.defineProperty(mockContext, 'keys', { value: jest.fn(() => Object.keys(moduleMap)) });

            withWebpackContext(mockContext, (load) => {
                expect(load()).toEqual([Migration1]);
            });
        });

        it('sorts migrations by filename so they run in timestamp order', () => {
            class Early {}
            class Late {}

            const mockContext = jest.fn((key: string) => {
                if (key.includes('9999')) return { Late };
                return { Early };
            });
            Object.defineProperty(mockContext, 'keys', { value: () => ['./9999999999999-Late.ts', './1000000000000-Early.ts'] });

            withWebpackContext(mockContext, (load) => {
                const result = load();
                expect(result.indexOf(Early)).toBeLessThan(result.indexOf(Late));
            });
        });
    });
});

describe('TypeORM config (PostgreSQL)', () => {
    it('uses the postgres driver type', () => {
        expect(opts.type).toBe('postgres');
    });

    it('defaults to port 5432 when no env var is set', () => {
        expect(getPostgresConnectionOptions(() => undefined).port).toBe(5432);
    });

    it('dataSource is instantiated', () => {
        expect(dataSource).toBeDefined();
        expect(dataSource instanceof DataSource).toBe(true);
    });

    it('keeps migrations manual for local development and the TypeORM CLI', () => {
        expect(opts.migrationsRun).toBe(false);
        expect(opts.synchronize).toBe(false);
    });

    it('runs the entire pending migration batch in one transaction for rollback on failure', () => {
        expect(opts.migrationsTransactionMode).toBe('all');
    });
});

describe('TypeORM migration build settings', () => {
    afterEach(() => {
        jest.dontMock('../environments/environment');
    });

    it.each([false, true])('sets migrationsRun to the build production flag (%s)', (production) => {
        jest.isolateModules(() => {
            jest.doMock('../environments/environment', () => ({ environment: { production } }));
            const { opts: buildOptions } = require('./typeorm.config') as typeof import('./typeorm.config');

            expect(buildOptions.migrationsRun).toBe(production);
            expect(buildOptions.migrationsTransactionMode).toBe('all');
            expect(buildOptions.synchronize).toBe(false);
        });
    });
});
