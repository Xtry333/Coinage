import { createSpyFromClass, Spy } from 'jest-auto-spies';

import { CreateEditItemDTO } from '@app/interfaces';

import { ItemsController } from './items.controller';
import { ItemDao } from '../daos/item.dao';
import { TagDao } from '../daos/tag.dao';
import { TransferItemDao } from '../daos/transferItem.dao';
import { Item } from '../entities/Item.entity';
import { Tag } from '../entities/Tag.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransferItem } from '../entities/TransferItem.entity';

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
        item = Object.assign(new Item(), { id: 2, name: 'Milk', tags: [tag], category: Promise.resolve(null) });
        items.getById.mockResolvedValue(item);
        items.save.mockImplementation(async (entity) => entity);
    });

    it('preserves existing tags when an older item client omits tagIds', async () => {
        await controller.saveItem(new CreateEditItemDTO(2, null, 'Milk', 5, null, null));
        expect(item.tags).toEqual([tag]);
        expect(tags.getByIds).not.toHaveBeenCalled();
        expect(items.save).toHaveBeenCalledWith(item);
    });

    it('supports explicit assignment removal on item saves', async () => {
        tags.getByIds.mockResolvedValue([]);
        await controller.saveItem(new CreateEditItemDTO(2, null, 'Milk', 5, null, null, []));
        expect(item.tags).toEqual([]);
        expect(tags.getByIds).toHaveBeenCalledWith([]);
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
});
