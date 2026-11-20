import { DataSource } from 'typeorm';

import { calculatePackagingContents, ItemPackagingInput, packagingLabel } from '@app/interfaces';

import { ItemPackagingService, validatePackaging } from './item-packaging.service';
import { Container } from '../entities/Container.entity';
import { Item } from '../entities/Item.entity';
import { ItemPackaging } from '../entities/ItemPackaging.entity';
import { TransferItem } from '../entities/TransferItem.entity';

const input: ItemPackagingInput = {
    containerId: 7,
    weight: null,
    weightUnit: null,
    volume: 330,
    volumeUnit: 'ml',
    itemCount: 1,
    barcode: null,
};

describe('packaging validation', () => {
    it.each([
        { weight: 0, weightUnit: 'g' },
        { weight: -1, weightUnit: 'kg' },
        { volume: Infinity },
        { volume: NaN },
        { volume: '330' },
        { volumeUnit: 'kg' },
        { weight: null, weightUnit: 'g' },
        { volume: 330, volumeUnit: null },
        { itemCount: 1.5 },
        { itemCount: 0 },
        { itemCount: 2147483648 },
        { containerId: -1 },
        { barcode: 'x'.repeat(65) },
        { isPreferred: 'yes' },
    ])('rejects invalid values: %p', (patch) => {
        expect(() => validatePackaging({ ...input, ...patch } as ItemPackagingInput)).toThrow();
    });

    it('allows weight, volume, count-only, and format-only packaging', () => {
        expect(() => validatePackaging(input)).not.toThrow();
        expect(() => validatePackaging({ ...input, itemCount: 2147483647 })).not.toThrow();
        expect(() => validatePackaging({ ...input, containerId: null, volume: null, volumeUnit: null, weight: 1, weightUnit: 'kg' })).not.toThrow();
        expect(() => validatePackaging({ ...input, volume: null, volumeUnit: null, itemCount: null })).not.toThrow();
    });

    it('rejects empty packaging and missing request bodies', () => {
        expect(() => validatePackaging({ ...input, containerId: null, volume: null, volumeUnit: null, itemCount: null })).toThrow();
        expect(() => validatePackaging(null as unknown as ItemPackagingInput)).toThrow();
    });

    it.each([
        { name: '' },
        { name: ' ' },
        { name: 'x'.repeat(65) },
        { containedPackagingId: 2, containedCount: 0 },
        { containedPackagingId: 2, containedCount: 1.5 },
        { containedPackagingId: 2, containedCount: 2147483648 },
        { containedCount: 24 },
        { containedPackagingId: 2, containedCount: 24, volume: 6, volumeUnit: 'l' },
    ])('rejects invalid names or manually supplied composite totals: %p', (patch) => {
        expect(() => validatePackaging({ ...input, ...patch })).toThrow();
    });
});

describe('derived packaging contents', () => {
    const can: ItemPackagingInput = { ...input, name: 'Can', containerId: null, volume: 0.25, volumeUnit: 'l' };
    const box: ItemPackagingInput = { ...can, name: 'Box', volume: null, volumeUnit: null, itemCount: null, containedPackagingId: 1, containedCount: 24 };
    const pallet: ItemPackagingInput = { ...box, name: 'Pallet', containedPackagingId: 2, containedCount: 10 };
    const variants = new Map([
        [1, can],
        [2, box],
        [3, pallet],
    ]);

    it('calculates boxes and nested pallets without treating purchase quantity as a content count', () => {
        expect(calculatePackagingContents(box, variants)).toMatchObject({ volume: 6, volumeUnit: 'l', itemCount: 24 });
        expect(calculatePackagingContents(pallet, variants)).toMatchObject({ volume: 60, volumeUnit: 'l', itemCount: 240 });
        expect(can.volume).toBe(0.25);
        expect(packagingLabel({ ...box, ...calculatePackagingContents(box, variants), containedPackagingName: 'Can' })).toBe('Box · 24 × Can · 6 l');
    });

    it('detects cycles, missing children, and unsafe totals', () => {
        expect(() => calculatePackagingContents(box, new Map([[1, box]]))).toThrow('cycle');
        expect(() => calculatePackagingContents(box, new Map())).toThrow('same product');
        expect(() => calculatePackagingContents({ ...pallet, containedCount: 2147483647 }, new Map([[2, { ...can, itemCount: 2147483647 }]]))).toThrow(
            'too large',
        );
    });

    it.each([{ volume: 0 }, { volume: -0.25 }, { volume: NaN }, { weight: 0 }, { weight: -1 }, { itemCount: 0 }, { itemCount: -1 }])(
        'rejects non-positive or invalid derived contents: %p',
        (patch) => {
            expect(() => calculatePackagingContents(box, new Map([[1, { ...can, ...patch }]]))).toThrow();
        },
    );
});

describe('ItemPackagingService', () => {
    let service: ItemPackagingService;
    let variants: ItemPackaging[];
    let container: Container;
    let repository: {
        find: jest.Mock;
        findOneBy: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
        update: jest.Mock;
    };
    let items: { findOne: jest.Mock; exists: jest.Mock };
    let containers: { findOneBy: jest.Mock };
    let transaction: jest.Mock;

    beforeEach(() => {
        variants = [];
        container = Object.assign(new Container(), { id: 7, name: 'Can', weight: null, weightUnit: null, volume: 330, volumeUnit: 'ml', itemCount: 1 });
        repository = {
            find: jest.fn(async ({ where }) => variants.filter((p) => Object.entries(where).every(([key, value]) => p[key as keyof ItemPackaging] === value))),
            findOneBy: jest.fn(
                async (where) => variants.find((p) => Object.entries(where).every(([key, value]) => p[key as keyof ItemPackaging] === value)) ?? null,
            ),
            create: jest.fn((data) => Object.assign(new ItemPackaging(), data)),
            save: jest.fn(async (data) => {
                const saved = Object.assign(new ItemPackaging(), data, { id: variants.length + 1 });
                variants.push(saved);
                return saved;
            }),
            update: jest.fn(async (where, patch) => {
                for (const p of variants) {
                    if (typeof where === 'number' ? p.id === where : Object.entries(where).every(([key, value]) => p[key as keyof ItemPackaging] === value)) {
                        Object.assign(p, patch);
                    }
                }
            }),
        };
        items = { findOne: jest.fn().mockResolvedValue({ id: 10 }), exists: jest.fn().mockResolvedValue(true) };
        containers = { findOneBy: jest.fn().mockResolvedValue(container) };
        const manager = { getRepository: (entity: unknown) => (entity === Item ? items : entity === Container ? containers : repository) };
        transaction = jest.fn(async (callback) => callback(manager));
        service = new ItemPackagingService({ ...manager, transaction } as unknown as DataSource);
    });

    it('supports multiple sizes per product and the same format across products', async () => {
        const first = await service.save(10, input);
        const second = await service.save(10, { ...input, volume: 500 });
        const otherProduct = await service.save(20, { ...input, weight: 400, weightUnit: 'g', volume: null, volumeUnit: null });
        expect(first.containerId).toBe(second.containerId);
        expect(first.containerId).toBe(otherProduct.containerId);
        expect(first.id).not.toBe(second.id);
        expect(first.volume).toBe(330);
        expect(otherProduct.weight).toBe(400);
        expect(container.volume).toBe(330);
        expect(items.findOne).toHaveBeenCalledWith({ where: { id: 10 }, lock: { mode: 'pessimistic_write' }, loadEagerRelations: false });
    });

    it('replaces sizes without rewriting the old variant referenced by purchases', async () => {
        const original = await service.save(10, { ...input, isPreferred: true });
        const replacement = await service.save(10, { ...input, volume: 500 }, original.id);
        expect(replacement.id).not.toBe(original.id);
        expect(replacement.isPreferred).toBe(true);
        expect(variants[0]).toMatchObject({ volume: 330, isArchived: true, isPreferred: false });
        expect(variants[1]).toMatchObject({ volume: 500, isArchived: false });
        for (const [, patch] of repository.update.mock.calls) {
            expect(patch).not.toHaveProperty('volume');
            expect(patch).not.toHaveProperty('weight');
            expect(patch).not.toHaveProperty('containerId');
        }
    });

    it('limits preference changes to one product and retains archived variants', async () => {
        const first = await service.save(10, { ...input, isPreferred: true });
        const second = await service.save(10, { ...input, volume: 500 });
        await service.save(20, { ...input, isPreferred: true });
        await service.setState(10, second.id, 'prefer');
        expect(variants.filter((p) => p.isPreferred).map((p) => p.itemId)).toEqual([10, 20]);
        expect(variants[0].isPreferred).toBe(false);
        await service.setState(10, first.id, 'archive');
        expect((await service.list(10)).find((p) => p.id === first.id)?.isArchived).toBe(true);
    });

    it('does not let one product edit, prefer, or assign another product’s variant', async () => {
        const variant = await service.save(20, input);
        await expect(service.save(10, input, variant.id)).rejects.toThrow('not found');
        await expect(service.setState(10, variant.id, 'prefer')).rejects.toThrow('not found');
        await expect(service.resolve(10, variant.id, 7)).rejects.toThrow('does not belong');
    });

    it('allows historical archived selections and preserves them for older clients', async () => {
        const variant = await service.save(10, input);
        await service.setState(10, variant.id, 'archive');
        expect((await service.resolve(10, variant.id, null))?.id).toBe(variant.id);
        const previous = Object.assign(new TransferItem(), { itemId: 10, containerId: 7, packagingId: variant.id });
        expect((await service.resolve(10, undefined, 7, previous))?.id).toBe(variant.id);
        expect(await service.resolve(10, null, 7, previous)).toBeNull();
    });

    it('snapshots legacy container selections per product, reusing an exact match', async () => {
        const first = await service.resolve(10, undefined, 7);
        const repeated = await service.resolve(10, undefined, 7);
        const otherProduct = await service.resolve(20, undefined, 7);
        expect(first?.id).toBe(repeated?.id);
        expect(otherProduct?.id).not.toBe(first?.id);
        container.volume = 500;
        expect(first?.volume).toBe(330);
        const changed = await service.resolve(10, undefined, 7);
        expect(changed?.volume).toBe(500);
        expect(changed?.id).not.toBe(first?.id);
    });

    it('validates before entering a transaction and checks catalog references', async () => {
        await expect(service.save(10, { ...input, volume: -5 })).rejects.toThrow();
        expect(transaction).not.toHaveBeenCalled();
        containers.findOneBy.mockResolvedValue(null);
        await expect(service.save(10, input)).rejects.toThrow('Container not found');
        items.findOne.mockResolvedValue(null);
        await expect(service.save(999, input)).rejects.toThrow('Item not found');
    });

    it('stores packaging names independently from legacy container names', async () => {
        const can = await service.save(10, { ...input, name: '  Slim can  ' });
        container.name = 'Legacy renamed';
        const result = await service.list(10);
        expect(result.find((p) => p.id === can.id)?.name).toBe('Slim can');
        expect(result.find((p) => p.id === can.id)?.containerName).toBe('Legacy renamed');
    });

    it('creates named boxes containing a specific can version and derives totals', async () => {
        const can = await service.save(10, { ...input, name: 'Can', containerId: null, volume: 0.25, volumeUnit: 'l' });
        const box = await service.save(10, {
            ...input,
            name: 'Box',
            containerId: null,
            volume: null,
            volumeUnit: null,
            itemCount: null,
            containedPackagingId: can.id,
            containedCount: 24,
        });
        expect(box).toMatchObject({
            name: 'Box',
            containedPackagingId: can.id,
            containedPackagingName: 'Can',
            volume: 6,
            volumeUnit: 'l',
            itemCount: 24,
            nestingDepth: 2,
        });
        expect(variants[1]).toMatchObject({ weight: null, volume: null, itemCount: null, containedCount: 24 });
    });

    it('rejects containment of another product, itself, or an ancestor when replacing a variant', async () => {
        const can = await service.save(10, { ...input, name: 'Can' });
        const outer: ItemPackagingInput = {
            ...input,
            name: 'Box',
            volume: null,
            volumeUnit: null,
            itemCount: null,
            containedPackagingId: can.id,
            containedCount: 24,
        };
        await expect(service.save(20, outer)).rejects.toThrow('same product');
        await expect(service.save(10, outer, can.id)).rejects.toThrow('itself');
        const box = await service.save(10, outer);
        await expect(service.save(10, { ...outer, containedPackagingId: box.id }, can.id)).rejects.toThrow('cycle');
    });
});
