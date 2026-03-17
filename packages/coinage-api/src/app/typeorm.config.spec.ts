import { loadMigrations } from './typeorm.config';

describe('loadMigrations', () => {
    describe('ts-node context (require.context unavailable)', () => {
        it('returns a single glob pattern string', () => {
            const result = loadMigrations();

            expect(result).toHaveLength(1);
            expect(typeof result[0]).toBe('string');
        });

        it('glob pattern matches timestamp-prefixed migration files', () => {
            const [pattern] = loadMigrations() as string[];

            expect(pattern).toMatch(/\[0-9\]\*/);
            expect(pattern).toMatch(/\{ts,js\}/);
        });
    });

    describe('webpack context (require.context available)', () => {
        it('returns constructor functions extracted from each matched module', () => {
            class Migration1 {}
            class Migration2 {}

            const moduleMap: Record<string, Record<string, unknown>> = {
                './1000000000000-CreateTables.ts': { Migration1 },
                './1654876993290-ReforgeForeignKeys.ts': { Migration2 },
            };

            const mockContext = jest.fn((key: string) => moduleMap[key]);
            mockContext.keys = jest.fn(() => Object.keys(moduleMap));

            const mockRequire = jest.fn() as unknown as NodeRequire;
            (mockRequire as any).context = jest.fn(() => mockContext);

            const result = loadMigrations(mockRequire);

            expect(result).toContain(Migration1);
            expect(result).toContain(Migration2);
            expect(result.every((m) => typeof m === 'function')).toBe(true);
        });

        it('sorts migrations by filename so they run in timestamp order', () => {
            class Early {}
            class Late {}

            const mockContext = jest.fn((key: string) => {
                if (key.includes('9999')) return { Late };
                return { Early };
            });
            mockContext.keys = jest.fn(() => ['./9999999999999-Late.ts', './1000000000000-Early.ts']);

            const mockRequire = jest.fn() as unknown as NodeRequire;
            (mockRequire as any).context = jest.fn(() => mockContext);

            const result = loadMigrations(mockRequire);

            expect(result.indexOf(Early)).toBeLessThan(result.indexOf(Late));
        });
    });
});
