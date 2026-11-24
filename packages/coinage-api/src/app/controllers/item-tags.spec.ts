import { createSpyFromClass, Spy } from 'jest-auto-spies';

import { CreateEditItemDTO } from '@app/interfaces';

import { ItemsController } from './items.controller';
import { ItemDao } from '../daos/item.dao';
import { TagDao } from '../daos/tag.dao';
import { TransferItemDao } from '../daos/transferItem.dao';
import { Container } from '../entities/Container.entity';
import { Item } from '../entities/Item.entity';
import { ItemPackaging } from '../entities/ItemPackaging.entity';
import { Tag } from '../entities/Tag.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { ItemPackagingContents } from '../entities/views/ItemPackagingContents.view';

describe('item tag save and listing contracts', () => {
    let controller: ItemsController;
    let items: Spy<ItemDao>;
    let tags: Spy<TagDao>;
    let transferItems: Spy<TransferItemDao>;
    const tag = Object.assign(new Tag(), { id: 1, name: 'Food', color: null });
    let item: Item;

    beforeEach(() => {
        items = createSpyFromClass(ItemDao);
        tags = createSpyFromClass(TagDao);
        transferItems = createSpyFromClass(TransferItemDao);
        controller = new ItemsController(items, transferItems, tags);
        item = Object.assign(new Item(), { id: 2, name: 'Milk', tags: [tag], category: Promise.resolve(null), isArchived: false });
        items.getById.mockResolvedValue(item);
        items.save.mockImplementation(async (entity) => entity);
    });

    it('preserves existing tags when an older item client omits tagIds', async () => {
        item.isArchived = true;
        await controller.saveItem(new CreateEditItemDTO(2, null, 'Milk', 5, null, null));
        expect(item.tags).toEqual([tag]);
        expect(item.isArchived).toBe(true);
        expect(tags.getByIds).not.toHaveBeenCalled();
        expect(items.save).toHaveBeenCalledWith(item);
    });

    it.each([false, true])('saves an explicit archive status of %s', async (isArchived) => {
        item.isArchived = !isArchived;
        await controller.saveItem(new CreateEditItemDTO(2, null, 'Milk', 5, null, null, undefined, isArchived));

        expect(item.isArchived).toBe(isArchived);
        expect(items.save).toHaveBeenCalledWith(item);
    });

    it('supports explicit assignment removal on item saves', async () => {
        tags.getByIds.mockResolvedValue([]);
        await controller.saveItem(new CreateEditItemDTO(2, null, 'Milk', 5, null, null, []));
        expect(item.tags).toEqual([]);
        expect(tags.getByIds).toHaveBeenCalledWith([]);
    });

    it('edits the existing catalog item and supports clearing its brand and category', async () => {
        item.brand = 'Old brand';
        item.categoryId = 5;
        tags.getByIds.mockResolvedValue([]);
        const result = await controller.saveItem(new CreateEditItemDTO(2, null, 'Oat milk', null, 500, 'ml', []));

        expect(items.getById).toHaveBeenCalledWith(2);
        expect(items.save).toHaveBeenCalledWith(item);
        expect(item).toMatchObject({ id: 2, brand: null, name: 'Oat milk', categoryId: null, containerSize: 500, containerSizeUnit: 'ml', tags: [] });
        expect(result).toEqual({ insertedId: 2 });
        expect(transferItems.save).not.toHaveBeenCalled();
    });

    it('includes archive status in item details', async () => {
        item.isArchived = true;
        transferItems.findByItemId.mockResolvedValue([]);

        const result = await controller.getItemById(2);

        expect(result.isArchived).toBe(true);
    });

    it('rejects unknown tag IDs before writing an item', async () => {
        tags.getByIds.mockRejectedValue(new Error('Unknown tag'));
        await expect(controller.saveItem(new CreateEditItemDTO(2, null, 'Milk', 5, null, null, [99]))).rejects.toThrow('Unknown tag');
        expect(items.save).not.toHaveBeenCalled();
        expect(item.tags).toEqual([tag]);
    });

    it('includes tagged unused catalog items alongside deduplicated used-item rows', async () => {
        const unused = Object.assign(new Item(), {
            id: 3,
            name: 'Unused',
            tags: [tag, { ...tag }],
            category: Promise.resolve(null),
        });
        const transfer = Object.assign(new Transfer(), { createdDate: new Date('2026-11-01'), currency: { symbol: 'PLN' } });
        const line = Object.assign(new TransferItem(), {
            id: 4,
            item,
            containerId: null,
            transfer: Promise.resolve(transfer),
            unitPrice: 3,
        });
        transferItems.findAllWithItemAndContainer.mockResolvedValue([line, line]);
        items.getAll.mockResolvedValue([item, unused]);

        const result = await controller.getAllItemsWithContainers();
        expect(result.map((row) => row.id)).toEqual([2, 3]);
        expect(result.every((row) => row.tags.length === 1 && row.tags[0].id === 1)).toBe(true);
        expect(result[1].lastUsedDate).toBeNull();
    });

    it('lists distinct packaging sizes and uses their historical contents, not the shared container size', async () => {
        const container = Object.assign(new Container(), { id: 7, name: 'Can', volume: 900, volumeUnit: 'ml' });
        const transfer = Object.assign(new Transfer(), { createdDate: new Date('2026-11-01'), currency: { symbol: 'PLN' } });
        const lines = [330, 500].map((volume, index) =>
            Object.assign(new TransferItem(), {
                id: index + 1,
                item,
                containerId: 7,
                container: Promise.resolve(container),
                transfer: Promise.resolve(transfer),
                unitPrice: 3,
                packagingId: index + 10,
                packaging: Object.assign(new ItemPackaging(), { id: index + 10, itemId: 2, containerId: 7, volume, volumeUnit: 'ml' }),
            }),
        );
        transferItems.findAllWithItemAndContainer.mockResolvedValue(lines);
        items.getAll.mockResolvedValue([item]);
        const result = await controller.getAllItemsWithContainers();
        expect(result).toHaveLength(2);
        expect(result.map((row) => row.containerVolume)).toEqual([330, 500]);
        expect(result.map((row) => row.packagingId)).toEqual([10, 11]);
    });

    it('uses a composite package’s own name and derived totals in purchase-price listings', async () => {
        const transfer = Object.assign(new Transfer(), { createdDate: new Date('2026-11-01'), currency: { symbol: 'PLN' } });
        const line = Object.assign(new TransferItem(), {
            id: 99,
            item,
            containerId: null,
            container: Promise.resolve(null),
            transfer: Promise.resolve(transfer),
            unitPrice: 48,
            packagingId: 25,
            packaging: Object.assign(new ItemPackaging(), {
                id: 25,
                itemId: 2,
                name: 'Box',
                volume: null,
                volumeUnit: null,
                containedPackagingId: 24,
                containedCount: 24,
                contents: Object.assign(new ItemPackagingContents(), { volume: 6, volumeUnit: 'l', itemCount: 24 }),
            }),
        });
        transferItems.findAllWithItemAndContainer.mockResolvedValue([line]);
        items.getAll.mockResolvedValue([item]);
        expect(await controller.getAllItemsWithContainers()).toEqual([
            expect.objectContaining({
                packagingId: 25,
                containerName: 'Box',
                containerVolume: 6,
                containerVolumeUnit: 'l',
                lastUnitPrice: 48,
            }),
        ]);
    });
});
