import { DataSource, QueryRunner } from 'typeorm';

import { getPostgresConnectionOptions } from '../../app/postgres-connection-options';
import { NormalizeMeasurementUnits1795175999000 } from './1795175999000-NormalizeMeasurementUnits';

describe('NormalizeMeasurementUnits migration', () => {
    let query: jest.Mock;
    let hasTable: jest.Mock;
    let runner: QueryRunner;

    beforeEach(() => {
        query = jest.fn().mockResolvedValue(undefined);
        hasTable = jest.fn().mockResolvedValue(true);
        runner = { query, hasTable, getCurrentSchema: jest.fn().mockResolvedValue('public') } as unknown as QueryRunner;
    });

    it('normalizes all five stored unit columns, including packaging snapshots', async () => {
        await new NormalizeMeasurementUnits1795175999000().up(runner);
        expect(hasTable).toHaveBeenCalledWith('public.item_packaging');
        expect(query).toHaveBeenCalledTimes(3);
        expect(query.mock.calls[0][0]).toContain('UPDATE "item" SET "container_size_unit" = LOWER(BTRIM("container_size_unit"))');
        for (const [sql] of query.mock.calls.slice(1)) {
            expect(sql).toContain('"weight_unit" = LOWER(BTRIM("weight_unit"))');
            expect(sql).toContain('"volume_unit" = LOWER(BTRIM("volume_unit"))');
        }
        expect(query.mock.calls[2][0]).toContain('UPDATE "item_packaging"');
        const sql = query.mock.calls.map(([statement]) => statement).join('\n');
        expect(sql).toContain('IS DISTINCT FROM');
        expect(sql).not.toMatch(/\bis_archived\b|\bDELETE\b|\bINSERT\b|\bALTER\b/i);
        expect(sql).not.toMatch(/"(?:name|weight|volume|container_size|quantity|unit_price|amount)"\s*=/);
    });

    it('also runs before packaging exists, so legacy backfills receive canonical units', async () => {
        hasTable.mockResolvedValue(false);
        await new NormalizeMeasurementUnits1795175999000().up(runner);
        expect(query).toHaveBeenCalledTimes(2);
        expect(query.mock.calls.map(([sql]) => sql).join('\n')).not.toContain('UPDATE "item_packaging"');
    });

    it('checks for snapshots in the active migration schema', async () => {
        jest.spyOn(runner, 'getCurrentSchema').mockResolvedValue('isolated_schema');
        await new NormalizeMeasurementUnits1795175999000().up(runner);
        expect(hasTable).toHaveBeenCalledWith('isolated_schema.item_packaging');
    });

    it('does not invent original casing on rollback', async () => {
        await new NormalizeMeasurementUnits1795175999000().down();
        expect(query).not.toHaveBeenCalled();
    });
});

const integration = process.env['COINAGE_PACKAGING_DB_TEST'] === '1' ? describe : describe.skip;

integration('measurement unit normalization on PostgreSQL', () => {
    let source: DataSource;
    let runner: QueryRunner;

    beforeAll(async () => {
        source = new DataSource({ type: 'postgres', ...getPostgresConnectionOptions(), synchronize: false });
        await source.initialize();
        runner = source.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        const schema = `coinage_unit_test_${process.pid}_${Date.now()}`;
        await runner.query(`CREATE SCHEMA "${schema}"`);
        await runner.query(`SET LOCAL search_path TO "${schema}"`);
        await runner.query(`
            CREATE TABLE item (id INT PRIMARY KEY, name TEXT, container_size DOUBLE PRECISION, container_size_unit TEXT);
            CREATE TABLE container (id INT PRIMARY KEY, name TEXT, weight DOUBLE PRECISION, weight_unit TEXT, volume DOUBLE PRECISION, volume_unit TEXT);
            CREATE TABLE item_packaging (id INT PRIMARY KEY, weight DOUBLE PRECISION, weight_unit TEXT, volume DOUBLE PRECISION, volume_unit TEXT, is_archived BOOLEAN);
            CREATE TABLE transfer_item (id INT PRIMARY KEY, quantity DOUBLE PRECISION, unit_price NUMERIC);
            CREATE TABLE currency (symbol TEXT);
            INSERT INTO item VALUES
                (1, 'Milk 1L', 1, 'L'), (2, 'Rice KG', 2, 'KG'), (3, 'Juice ML', 300, 'ML'),
                (4, 'Juice CL', 50, 'cL'), (5, 'Flour G', 500, 'G'), (6, 'Unknown', 3, NULL),
                (7, 'Padded', 4, ' Kg '), (8, 'Custom', 1, 'CUSTOM'), (9, 'Empty', 0, ''),
                (10, 'Canonical', 1, 'kg');
            INSERT INTO container VALUES
                (1, 'Bottle L', 1, 'KG', 1, 'L'), (2, 'Can ML', 200, 'G', 330, 'ML'),
                (3, 'Padded CL', 2, ' Kg ', 33, ' cL '), (4, 'Null', NULL, NULL, NULL, NULL),
                (5, 'Canonical', 1, 'kg', 1, 'l');
            INSERT INTO item_packaging
                SELECT id, weight, weight_unit, volume, volume_unit, id = 2 FROM container;
            INSERT INTO transfer_item VALUES (1, 2, 12.34);
            INSERT INTO currency VALUES ('PLN'), ('EUR')
        `);
    });

    afterAll(async () => {
        if (runner?.isTransactionActive) await runner.rollbackTransaction();
        if (runner) await runner.release();
        if (source?.isInitialized) await source.destroy();
    });

    it('lowercases and trims every unit column without rescaling values or editing unrelated data', async () => {
        await new NormalizeMeasurementUnits1795175999000().up(runner);
        const items = await runner.query(`SELECT * FROM item ORDER BY id`);
        expect(items.map((item: { container_size_unit: string | null }) => item.container_size_unit)).toEqual([
            'l',
            'kg',
            'ml',
            'cl',
            'g',
            null,
            'kg',
            'custom',
            '',
            'kg',
        ]);
        expect(items.map((item: { container_size: number }) => item.container_size)).toEqual([1, 2, 300, 50, 500, 3, 4, 1, 0, 1]);
        expect(items[0].name).toBe('Milk 1L');
        const expected = [
            { id: 1, weight: 1, weight_unit: 'kg', volume: 1, volume_unit: 'l' },
            { id: 2, weight: 200, weight_unit: 'g', volume: 330, volume_unit: 'ml' },
            { id: 3, weight: 2, weight_unit: 'kg', volume: 33, volume_unit: 'cl' },
            { id: 4, weight: null, weight_unit: null, volume: null, volume_unit: null },
            { id: 5, weight: 1, weight_unit: 'kg', volume: 1, volume_unit: 'l' },
        ];
        for (const table of ['container', 'item_packaging']) {
            expect(await runner.query(`SELECT id, weight, weight_unit, volume, volume_unit FROM "${table}" ORDER BY id`)).toEqual(expected);
        }
        expect(await runner.query(`SELECT is_archived FROM item_packaging WHERE id = 2`)).toEqual([{ is_archived: true }]);
        expect(await runner.query(`SELECT * FROM transfer_item`)).toEqual([{ id: 1, quantity: 2, unit_price: '12.34' }]);
        expect(await runner.query(`SELECT * FROM currency ORDER BY symbol`)).toEqual([{ symbol: 'EUR' }, { symbol: 'PLN' }]);
    });

    it('is idempotent and does not rewrite rows that are already normalized', async () => {
        const readVersions = async () => {
            const versions = [];
            for (const table of ['item', 'container', 'item_packaging']) {
                versions.push(await runner.query(`SELECT id, ctid::text AS version FROM "${table}" ORDER BY id`));
            }
            return versions;
        };
        const before = await readVersions();
        await new NormalizeMeasurementUnits1795175999000().up(runner);
        expect(await readVersions()).toEqual(before);
    });
});
