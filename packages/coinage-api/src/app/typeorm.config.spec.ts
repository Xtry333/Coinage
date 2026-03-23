import { loadMigrations } from './typeorm.config';

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
        function withWebpackContext(mockContext: jest.Mock, fn: () => void): void {
            // Simulate webpack bundle: inject __webpack_require__ and require.context
            (global as any).__webpack_require__ = true;
            (require as any).context = jest.fn(() => mockContext);
            try {
                fn();
            } finally {
                delete (global as any).__webpack_require__;
                delete (require as any).context;
            }
        }

        it('returns constructor functions extracted from each matched module', () => {
            class Migration1 {}
            class Migration2 {}

            const moduleMap: Record<string, Record<string, unknown>> = {
                './1000000000000-CreateTables.ts': { Migration1 },
                './1654876993290-ReforgeForeignKeys.ts': { Migration2 },
            };

            const mockContext = jest.fn((key: string) => moduleMap[key]);
            Object.defineProperty(mockContext, 'keys', { value: jest.fn(() => Object.keys(moduleMap)) });

            withWebpackContext(mockContext, () => {
                const result = loadMigrations();
                expect(result).toContain(Migration1);
                expect(result).toContain(Migration2);
                expect(result.every((m) => typeof m === 'function')).toBe(true);
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

            withWebpackContext(mockContext, () => {
                const result = loadMigrations();
                expect(result.indexOf(Early)).toBeLessThan(result.indexOf(Late));
            });
        });
    });
});
