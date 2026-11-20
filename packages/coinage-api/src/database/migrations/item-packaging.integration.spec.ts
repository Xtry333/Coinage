import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { ItemPackagingInput } from '@app/interfaces';

import { TransferItemDao } from '../../app/daos/transferItem.dao';
import entities from '../../app/entities/_index';
import { Container } from '../../app/entities/Container.entity';
import { TransferItem } from '../../app/entities/TransferItem.entity';
import { getPostgresConnectionOptions } from '../../app/postgres-connection-options';
import { ItemPackagingService, toPackagingDTO } from '../../app/services/item-packaging.service';
import { SharedContainersService } from '../../app/services/shared-containers.service';
import { TransferItemsService } from '../../app/services/transfer-items.service';
import { NormalizeMeasurementUnits1795175999000 } from './1795175999000-NormalizeMeasurementUnits';
import { AddItemPackaging1795176000000 } from './1795176000000-AddItemPackaging';
import { AddPackagingComposition1795176001000 } from './1795176001000-AddPackagingComposition';

// Opt in with COINAGE_PACKAGING_DB_TEST=1. All DDL and fixture data are isolated in
// a disposable schema inside a transaction which is always rolled back.
const integration = process.env['COINAGE_PACKAGING_DB_TEST'] === '1' ? describe : describe.skip;

integration('item packaging migration on PostgreSQL', () => {
    let source: DataSource;
    let runner: QueryRunner;
    let originalPackagingRows: unknown[];

    beforeAll(async () => {
        source = new DataSource({
            type: 'postgres',
            ...getPostgresConnectionOptions(),
            synchronize: false,
            entities,
            namingStrategy: new SnakeNamingStrategy(),
        });
        await source.initialize();
        runner = source.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        const schema = `coinage_packaging_test_${process.pid}_${Date.now()}`;
        await runner.query(`CREATE SCHEMA "${schema}"`);
        await runner.query(`SET LOCAL search_path TO "${schema}"`);
        await runner.query(`
            CREATE TABLE item (
                id SERIAL PRIMARY KEY, brand VARCHAR(50), name VARCHAR(50), category_id INT,
                container_size DOUBLE PRECISION, container_size_unit VARCHAR(16),
                created_date TIMESTAMP DEFAULT NOW(), edited_date TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE container (
                id SERIAL PRIMARY KEY, name VARCHAR(64), weight DOUBLE PRECISION, weight_unit VARCHAR(8),
                volume DOUBLE PRECISION, volume_unit VARCHAR(8), item_count INT
            );
            CREATE TABLE transfer (id SERIAL PRIMARY KEY, date TIMESTAMP);
            CREATE TABLE transfer_item (
                id SERIAL PRIMARY KEY, item_id INT NOT NULL, container_id INT, transfer_id INT,
                quantity DOUBLE PRECISION NOT NULL DEFAULT 1, unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
                total_set_price NUMERIC(12,2) NOT NULL DEFAULT 0, total_set_discount NUMERIC(12,2) NOT NULL DEFAULT 0
            );
            CREATE TABLE tag (id SERIAL PRIMARY KEY, name VARCHAR(64), color VARCHAR(7));
            CREATE TABLE item_tag (item_id INT, tag_id INT);
            INSERT INTO item (id, name) VALUES (1, 'Cola'), (2, 'Juice');
            INSERT INTO item (id, name, container_size, container_size_unit) VALUES (3, 'Rice', 1, 'KG'), (4, 'Unused flour', 500, 'G');
            INSERT INTO container (id, name, volume, volume_unit, item_count) VALUES (7, 'Can', 330, 'ML', 1);
            INSERT INTO transfer (id, date) VALUES (1, '2026-11-01'), (2, '2026-11-02');
            INSERT INTO transfer_item (item_id, container_id, transfer_id) VALUES (1, 7, 1), (1, 7, 2), (2, 7, 1), (3, NULL, 1)
        `);
        await runner.query(`
            CREATE VIEW items_with_containers AS
            SELECT item.id AS item_id, item.brand AS item_brand, item.name AS item_name,
                item.category_id AS item_category_id, item.container_size AS item_container_size,
                item.container_size_unit AS item_container_size_unit, item.created_date AS item_created_date,
                item.edited_date AS item_updated_date, c.id AS container_id, c.name AS container_name,
                c.weight AS container_weight, c.weight_unit AS container_weight_unit,
                c.volume AS container_volume, c.volume_unit AS container_volume_unit, c.item_count AS container_item_count
            FROM item JOIN transfer_item ti ON ti.item_id = item.id JOIN container c ON c.id = ti.container_id
        `);
        await new NormalizeMeasurementUnits1795175999000().up(runner);
        await new AddItemPackaging1795176000000().up(runner);
        originalPackagingRows = await runner.query(`SELECT * FROM item_packaging ORDER BY id`);
        await new AddPackagingComposition1795176001000().up(runner);
    });

    afterAll(async () => {
        if (runner?.isTransactionActive) await runner.rollbackTransaction();
        if (runner) await runner.release();
        if (source?.isInitialized) await source.destroy();
    });

    function isolatedSource(): DataSource {
        return {
            getRepository: runner.manager.getRepository.bind(runner.manager),
            transaction: runner.manager.transaction.bind(runner.manager),
        } as unknown as DataSource;
    }

    const canInput: ItemPackagingInput = {
        name: 'Can',
        containerId: null,
        weight: null,
        weightUnit: null,
        volume: 0.25,
        volumeUnit: 'l',
        itemCount: 1,
        barcode: null,
    };
    const outerInput: ItemPackagingInput = {
        name: 'Box',
        containerId: null,
        weight: null,
        weightUnit: null,
        volume: null,
        volumeUnit: null,
        itemCount: null,
        barcode: null,
    };

    async function expectSqlRejected(sql: string, parameters: unknown[] = []): Promise<void> {
        await runner.query(`SAVEPOINT packaging_guard`);
        try {
            await expect(runner.query(sql, parameters)).rejects.toThrow();
        } finally {
            await runner.query(`ROLLBACK TO SAVEPOINT packaging_guard`);
            await runner.query(`RELEASE SAVEPOINT packaging_guard`);
        }
    }

    it('backfills one variant per product/container and preserves deprecated sizes and unused items', async () => {
        const variants = await runner.query(`SELECT * FROM item_packaging ORDER BY item_id`);
        expect(variants).toHaveLength(4);
        expect(variants[0]).toMatchObject({ item_id: 1, container_id: 7, volume: 330, is_preferred: true });
        expect(variants[1]).toMatchObject({ item_id: 2, container_id: 7, volume: 330 });
        expect(variants[0].id).not.toBe(variants[1].id);
        expect(variants[2]).toMatchObject({ item_id: 3, weight: 1, weight_unit: 'kg', volume: null });
        expect(variants[3]).toMatchObject({ item_id: 4, weight: 500, weight_unit: 'g' });
        const lines = await runner.query(`SELECT * FROM transfer_item ORDER BY id`);
        expect(lines.every((line: { packaging_id: number }) => line.packaging_id != null)).toBe(true);
        expect(lines[0].packaging_id).toBe(lines[1].packaging_id);
        expect(
            await runner.query(`
            SELECT id, item_id, container_id, weight, weight_unit, volume, volume_unit, item_count, barcode, is_preferred, is_archived
            FROM item_packaging ORDER BY id
        `),
        ).toEqual(originalPackagingRows);
        expect(variants[0].name).toBe('Can');
        expect(variants[2].name).toMatch(/^Package /);
        expect(await runner.query(`SELECT name FROM container WHERE id = 7`)).toEqual([{ name: 'Can' }]);
    });

    it('keeps historical contents independent of the shared container and supports several sizes per format', async () => {
        await runner.query(`UPDATE container SET volume = 900 WHERE id = 7`);
        expect(await runner.query(`SELECT DISTINCT volume FROM item_packaging WHERE container_id = 7`)).toEqual([{ volume: 330 }]);
        await runner.query(`INSERT INTO item_packaging (item_id, container_id, volume, volume_unit) VALUES (1, 7, 500, 'ml')`);
        const options = await runner.query(`SELECT container_volume FROM items_with_containers WHERE item_id = 1 ORDER BY container_volume`);
        expect(options).toEqual([{ container_volume: 330 }, { container_volume: 500 }]);
        const historical = await runner.query(`
            SELECT p.volume FROM transfer_item ti JOIN item_packaging p ON p.id = ti.packaging_id WHERE ti.item_id = 1
        `);
        expect(historical).toEqual([{ volume: 330 }, { volume: 330 }]);
    });

    it('enforces product ownership and a single preferred variant in the database', async () => {
        const [variant] = await runner.query(`SELECT id FROM item_packaging WHERE item_id = 1 AND is_preferred`);
        await runner.query(`SAVEPOINT invalid_product`);
        await expect(runner.query(`INSERT INTO transfer_item (item_id, packaging_id) VALUES (2, $1)`, [variant.id])).rejects.toThrow();
        await runner.query(`ROLLBACK TO SAVEPOINT invalid_product`);
        await runner.query(`SAVEPOINT duplicate_preference`);
        await expect(runner.query(`INSERT INTO item_packaging (item_id, is_preferred) VALUES (1, TRUE)`)).rejects.toThrow();
        await runner.query(`ROLLBACK TO SAVEPOINT duplicate_preference`);
    });

    it('saves and replaces variants through TypeORM without changing purchased sizes', async () => {
        const isolated = {
            getRepository: runner.manager.getRepository.bind(runner.manager),
            transaction: runner.manager.transaction.bind(runner.manager),
        } as unknown as DataSource;
        const service = new ItemPackagingService(isolated);
        const created = await service.save(1, {
            containerId: 7,
            weight: null,
            weightUnit: null,
            volume: 750,
            volumeUnit: 'ml',
            itemCount: 1,
            barcode: '1234',
            isPreferred: true,
        });
        const replacement = await service.save(1, { ...created, volume: 1000 }, created.id);
        expect(replacement.id).not.toBe(created.id);
        expect(replacement.isPreferred).toBe(true);
        const variants = await service.list(1);
        expect(variants.find((p) => p.id === created.id)).toMatchObject({ volume: 750, isArchived: true, isPreferred: false });
        const historical = await runner.query(`SELECT p.volume FROM transfer_item ti JOIN item_packaging p ON p.id = ti.packaging_id WHERE ti.item_id = 1`);
        expect(historical).toEqual([{ volume: 330 }, { volume: 330 }]);
    });

    it('persists different sizes at the same price as separate transfer lines and reloads their snapshots', async () => {
        const isolated = {
            getRepository: runner.manager.getRepository.bind(runner.manager),
            transaction: runner.manager.transaction.bind(runner.manager),
        } as unknown as DataSource;
        const packaging = new ItemPackagingService(isolated);
        const dao = new TransferItemDao(runner.manager.getRepository(TransferItem));
        const transfers = new TransferItemsService(dao, packaging);
        const variants = await packaging.list(1);
        const original = variants.find((p) => p.volume === 330);
        const replacement = variants.find((p) => p.isPreferred);
        if (!original || !replacement) throw new Error('Missing packaging fixtures');
        const line = { itemId: 1, transferId: 1, containerId: 7, quantity: 1, unitPrice: 3, totalSetPrice: 3, totalSetDiscount: 0 };
        const first = await transfers.save(Object.assign(new TransferItem(), line, { packagingId: original.id }));
        const second = await transfers.save(Object.assign(new TransferItem(), line, { packagingId: replacement.id }));
        expect(first.id).not.toBe(second.id);
        expect((await dao.getById(first.id)).packaging?.volume).toBe(330);
        expect((await dao.getById(second.id)).packaging?.volume).toBe(1000);
    });

    it('edits legacy shared definitions while protecting saved sizes by default', async () => {
        const isolated = {
            getRepository: runner.manager.getRepository.bind(runner.manager),
            transaction: runner.manager.transaction.bind(runner.manager),
        } as unknown as DataSource;
        const repository = runner.manager.getRepository(Container);
        const original = await repository.save(
            Object.assign(new Container(), {
                name: 'Legacy bottle',
                weight: null,
                weightUnit: null,
                volume: 330,
                volumeUnit: 'ml',
                itemCount: 1,
            }),
        );
        const packaging = new ItemPackagingService(isolated);
        const savedSize = await packaging.save(1, { ...original, containerId: original.id, barcode: null });
        await new SharedContainersService(isolated).update(original.id, { name: 'Shared bottle', volume: 500, acknowledgeHistoricalImpact: true });
        const refreshed = (await packaging.list(1)).find((p) => p.id === savedSize.id);
        expect(refreshed).toMatchObject({ volume: 330, containerName: 'Shared bottle' });
        expect((await repository.findOneBy({ id: original.id }))?.volume).toBe(500);
    });

    it('preserves repeated purchase lines and changes packaging on an existing line without stale relations overriding it', async () => {
        const packaging = new ItemPackagingService(isolatedSource());
        const original = await packaging.save(2, canInput);
        const larger = await packaging.save(2, { ...canInput, volume: 0.5 });
        const dao = new TransferItemDao(runner.manager.getRepository(TransferItem));
        const transfers = new TransferItemsService(dao, packaging);
        const line = { itemId: 2, transferId: 2, packagingId: original.id, quantity: 1, unitPrice: 3, totalSetPrice: 3, totalSetDiscount: 0 };
        const first = await transfers.save(Object.assign(new TransferItem(), line));
        const second = await transfers.save(Object.assign(new TransferItem(), line, { quantity: 2, totalSetPrice: 5, totalSetDiscount: 1 }));
        expect(second.id).not.toBe(first.id);
        expect(await dao.getById(first.id)).toMatchObject({ quantity: 1, totalSetPrice: 3, packagingId: original.id });
        expect(await dao.getById(second.id)).toMatchObject({ quantity: 2, totalSetPrice: 5, totalSetDiscount: 1, packagingId: original.id });

        const edited = await dao.getById(first.id);
        edited.packagingId = larger.id;
        await transfers.save(edited);
        expect((await dao.getById(first.id)).packaging?.volume).toBe(0.5);
        edited.packagingId = null;
        await transfers.save(edited);
        expect(await dao.getById(first.id)).toMatchObject({ packagingId: null, containerId: null, packaging: null });
    });

    it('retroactively corrects matching legacy sizes across products, including archived snapshots, only after consent', async () => {
        const isolated = {
            getRepository: runner.manager.getRepository.bind(runner.manager),
            transaction: runner.manager.transaction.bind(runner.manager),
        } as unknown as DataSource;
        const repository = runner.manager.getRepository(Container);
        const original = await repository.save(
            Object.assign(new Container(), {
                name: 'Old can',
                weight: null,
                weightUnit: null,
                volume: 330,
                volumeUnit: 'ml',
                itemCount: 1,
            }),
        );
        const otherContainer = await repository.save(
            Object.assign(new Container(), {
                name: 'Other can',
                weight: null,
                weightUnit: null,
                volume: 330,
                volumeUnit: 'ml',
                itemCount: 1,
            }),
        );
        const packaging = new ItemPackagingService(isolated);
        const input = { ...original, containerId: original.id, barcode: 'keep-this-barcode' };
        const first = await packaging.save(1, input);
        const second = await packaging.save(2, input);
        const differentSize = await packaging.save(1, { ...input, volume: 500 });
        const unrelated = await packaging.save(1, { ...input, containerId: otherContainer.id });
        const dao = new TransferItemDao(runner.manager.getRepository(TransferItem));
        const transfers = new TransferItemsService(dao, packaging);
        const purchase = await transfers.save(
            Object.assign(new TransferItem(), {
                transferId: 1,
                itemId: 2,
                packagingId: second.id,
                containerId: original.id,
                quantity: 2,
                unitPrice: 4,
                totalSetPrice: 8,
                totalSetDiscount: 0,
            }),
        );
        await packaging.setState(2, second.id, 'archive');
        const service = new SharedContainersService(isolated);
        await expect(service.update(original.id, { volume: 350, correctMatchingPackaging: true })).rejects.toThrow('Acknowledge');
        expect((await repository.findOneBy({ id: original.id }))?.volume).toBe(330);
        const response = await service.update(original.id, { volume: 350, correctMatchingPackaging: true, acknowledgeHistoricalImpact: true });
        expect(response.message).toContain('2 matching packaging variants');
        const productOne = await packaging.list(1);
        expect(productOne.find((p) => p.id === first.id)).toMatchObject({ volume: 350, barcode: 'keep-this-barcode', isArchived: false });
        expect(productOne.find((p) => p.id === differentSize.id)?.volume).toBe(500);
        expect(productOne.find((p) => p.id === unrelated.id)?.volume).toBe(330);
        const historical = await dao.getById(purchase.id);
        expect(historical.packaging).toMatchObject({ volume: 350, isArchived: true });
        expect(historical).toMatchObject({ quantity: 2, unitPrice: 4, totalSetPrice: 8 });
    });

    it('rolls back a shared definition edit if its historical size correction fails', async () => {
        const repository = runner.manager.getRepository(Container);
        const original = await repository.save(
            Object.assign(new Container(), {
                name: 'Atomic legacy can',
                weight: null,
                weightUnit: null,
                volume: 330,
                volumeUnit: 'ml',
                itemCount: 1,
            }),
        );
        const failing = {
            transaction: (callback: (manager: EntityManager) => Promise<unknown>) =>
                runner.manager.transaction((manager) =>
                    callback({
                        getRepository: manager.getRepository.bind(manager),
                        createQueryBuilder: () => {
                            throw new Error('Correction failed');
                        },
                    } as unknown as EntityManager),
                ),
        } as unknown as DataSource;
        await expect(
            new SharedContainersService(failing).update(original.id, {
                volume: 500,
                correctMatchingPackaging: true,
                acknowledgeHistoricalImpact: true,
            }),
        ).rejects.toThrow('Correction failed');
        expect((await repository.findOneBy({ id: original.id }))?.volume).toBe(330);
    });

    it('derives boxes and pallets from named packages without requiring legacy containers', async () => {
        const packaging = new ItemPackagingService(isolatedSource());
        const can = await packaging.save(1, canInput);
        const box = await packaging.save(1, { ...outerInput, containedPackagingId: can.id, containedCount: 24 });
        const pallet = await packaging.save(1, { ...outerInput, name: 'Pallet', containedPackagingId: box.id, containedCount: 10 });
        expect(box).toMatchObject({ name: 'Box', containerId: null, volume: 6, volumeUnit: 'l', itemCount: 24, nestingDepth: 2 });
        expect(pallet).toMatchObject({ name: 'Pallet', volume: 60, itemCount: 240, nestingDepth: 3 });
        const listed = await packaging.list(1);
        expect(listed.find((p) => p.id === box.id)).toMatchObject({ volume: 6, itemCount: 24, containedPackagingName: 'Can' });
        expect(listed.find((p) => p.id === pallet.id)).toMatchObject({ volume: 60, itemCount: 240 });
        expect(await runner.query(`SELECT weight, volume, item_count FROM item_packaging WHERE id = $1`, [box.id])).toEqual([
            { weight: null, volume: null, item_count: null },
        ]);
        expect(
            await runner.query(`SELECT container_name, container_id, container_volume FROM items_with_containers WHERE packaging_id = $1`, [box.id]),
        ).toEqual([{ container_name: 'Box', container_id: null, container_volume: 6 }]);
    });

    it('pins historical boxes to their original inner version when can sizes are replaced', async () => {
        const packaging = new ItemPackagingService(isolatedSource());
        const can = await packaging.save(1, canInput);
        const box = await packaging.save(1, { ...outerInput, containedPackagingId: can.id, containedCount: 24 });
        const dao = new TransferItemDao(runner.manager.getRepository(TransferItem));
        const transfers = new TransferItemsService(dao, packaging);
        const purchased = await transfers.save(
            Object.assign(new TransferItem(), {
                transferId: 1,
                itemId: 1,
                packagingId: box.id,
                containerId: null,
                quantity: 1,
                unitPrice: 48,
                totalSetPrice: 48,
                totalSetDiscount: 0,
            }),
        );
        const newCan = await packaging.save(1, { ...canInput, volume: 0.3 }, can.id);
        expect((await packaging.list(1)).find((p) => p.id === box.id)?.volume).toBe(6);
        const newBox = await packaging.save(1, { ...outerInput, containedPackagingId: newCan.id, containedCount: 24 }, box.id);
        expect(newBox.volume).toBeCloseTo(7.2);
        const historical = await dao.getById(purchased.id);
        expect(historical.packaging?.containedPackagingId).toBe(can.id);
        if (!historical.packaging) throw new Error('Missing purchased package');
        expect(toPackagingDTO(historical.packaging)).toMatchObject({ name: 'Box', volume: 6, volumeUnit: 'l', itemCount: 24, isArchived: true });
        expect(historical).toMatchObject({ quantity: 1, unitPrice: 48 });
    });

    it('enforces same-product composition, integer counts, no direct/indirect cycles, and deletion restrictions in PostgreSQL', async () => {
        const packaging = new ItemPackagingService(isolatedSource());
        const a = await packaging.save(1, { ...canInput, name: 'A' });
        const b = await packaging.save(1, { ...canInput, name: 'B' });
        await runner.query(
            `
            UPDATE item_packaging SET contained_packaging_id = $1, contained_count = 2, volume = NULL, volume_unit = NULL, item_count = NULL WHERE id = $2
        `,
            [b.id, a.id],
        );
        await expectSqlRejected(
            `
            UPDATE item_packaging SET contained_packaging_id = $1, contained_count = 2, volume = NULL, volume_unit = NULL, item_count = NULL WHERE id = $2
        `,
            [a.id, b.id],
        );
        await expectSqlRejected(`UPDATE item_packaging SET contained_packaging_id = id WHERE id = $1`, [a.id]);
        await expectSqlRejected(`INSERT INTO item_packaging (item_id, name, contained_packaging_id, contained_count) VALUES (2, 'Wrong product', $1, 2)`, [
            b.id,
        ]);
        for (const count of [null, 0, -1]) {
            await expectSqlRejected(`INSERT INTO item_packaging (item_id, name, contained_packaging_id, contained_count) VALUES (1, 'Bad count', $1, $2)`, [
                b.id,
                count,
            ]);
        }
        await expectSqlRejected(`INSERT INTO item_packaging (item_id, name, contained_count) VALUES (1, 'Missing child', 2)`);
        await expectSqlRejected(
            `INSERT INTO item_packaging (item_id, name, contained_packaging_id, contained_count, volume, volume_unit) VALUES (1, 'Manual total', $1, 2, 6, 'l')`,
            [b.id],
        );
        await expectSqlRejected(`DELETE FROM item_packaging WHERE id = $1`, [b.id]);
        await packaging.setState(1, b.id, 'archive');
        expect((await packaging.list(1)).find((p) => p.id === a.id)).toMatchObject({ volume: 0.5, containedPackagingName: 'B' });
    });

    it('limits nested packaging depth in both the API and the database', async () => {
        const packaging = new ItemPackagingService(isolatedSource());
        const leaf = await packaging.save(1, canInput);
        let current = leaf;
        for (let depth = 2; depth <= 32; depth++) {
            const [next] = await runner.query(
                `
                INSERT INTO item_packaging (item_id, name, contained_packaging_id, contained_count) VALUES (1, $1, $2, 2) RETURNING id
            `,
                [`Depth ${depth}`, current.id],
            );
            current = { ...current, id: next.id };
        }
        expect((await packaging.list(1)).find((p) => p.id === current.id)?.nestingDepth).toBe(32);
        await expect(packaging.save(1, { ...outerInput, containedPackagingId: current.id, containedCount: 2 })).rejects.toThrow('32 levels');
        await expectSqlRejected(`INSERT INTO item_packaging (item_id, name, contained_packaging_id, contained_count) VALUES (1, 'Too deep', $1, 2)`, [
            current.id,
        ]);
        const anotherLeaf = await packaging.save(1, canInput);
        await expectSqlRejected(
            `UPDATE item_packaging SET contained_packaging_id = $1, contained_count = 2, volume = NULL, volume_unit = NULL, item_count = NULL WHERE id = $2`,
            [anotherLeaf.id, leaf.id],
        );
        expect((await packaging.list(1)).find((p) => p.id === current.id)?.nestingDepth).toBe(32);
    });

    it('propagates explicit legacy leaf corrections to derived outer totals without overwriting packaging names', async () => {
        const source = isolatedSource();
        const legacy = await runner.manager.getRepository(Container).save(
            Object.assign(new Container(), {
                name: 'Legacy can',
                weight: null,
                weightUnit: null,
                volume: 0.25,
                volumeUnit: 'l',
                itemCount: 1,
            }),
        );
        const packaging = new ItemPackagingService(source);
        const can = await packaging.save(1, { ...canInput, name: 'Own can name', containerId: legacy.id });
        const box = await packaging.save(1, { ...outerInput, name: 'Own box name', containedPackagingId: can.id, containedCount: 24 });
        await new SharedContainersService(source).update(legacy.id, {
            name: 'Legacy renamed',
            volume: 0.3,
            correctMatchingPackaging: true,
            acknowledgeHistoricalImpact: true,
        });
        const updated = await packaging.list(1);
        expect(updated.find((p) => p.id === can.id)).toMatchObject({ name: 'Own can name', volume: 0.3 });
        const outer = updated.find((p) => p.id === box.id);
        expect(outer?.name).toBe('Own box name');
        expect(outer?.volume).toBeCloseTo(7.2);
    });
});
