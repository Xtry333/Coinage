import { ForbiddenException } from '@nestjs/common';
import { createSpyFromClass, Spy } from 'jest-auto-spies';

import { ItemDao } from '../daos/item.dao';
import { TagDao } from '../daos/tag.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Item } from '../entities/Item.entity';
import { Tag } from '../entities/Tag.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { getTransferTags } from '../services/tag-mapper';
import { TagsController } from './tags.controller';

describe('TagsController', () => {
    let controller: TagsController;
    let tagDao: Spy<TagDao>;
    let itemDao: Spy<ItemDao>;
    let transferDao: Spy<TransferDao>;
    const tag = Object.assign(new Tag(), { id: 1, name: 'Holiday', color: null });

    beforeEach(() => {
        tagDao = createSpyFromClass(TagDao);
        itemDao = createSpyFromClass(ItemDao);
        transferDao = createSpyFromClass(TransferDao);
        controller = new TagsController(tagDao, itemDao, transferDao);
    });

    it('removes only a direct assignment while keeping the inherited tag visible', async () => {
        const item = Object.assign(new Item(), { tags: [tag] });
        const transfer = Object.assign(new Transfer(), {
            id: 3,
            ownerUserId: 7,
            tags: [tag],
            transferItems: [Object.assign(new TransferItem(), { item })],
        });
        transferDao.getById.mockResolvedValue(transfer);
        tagDao.getByIds.mockResolvedValue([]);

        expect(await controller.setTransferTags(7, 3, { tagIds: [] })).toEqual({ insertedId: 3 });
        expect(transferDao.setTags).toHaveBeenCalledWith(3, []);
        expect(transferDao.save).not.toHaveBeenCalled();
        expect(transfer.tags).toEqual([]);
        expect(item.tags).toEqual([tag]);
        expect(itemDao.save).not.toHaveBeenCalled();
        expect(getTransferTags(transfer)).toEqual([{ ...tag, isDirect: false, isInherited: true }]);
    });

    it('does not grant access to another user through the new transfer tag endpoint', async () => {
        transferDao.getById.mockResolvedValue(
            Object.assign(new Transfer(), {
                ownerUserId: 8,
                originAccount: { userId: 8 },
            }),
        );
        await expect(controller.setTransferTags(7, 3, { tagIds: [1] })).rejects.toBeInstanceOf(ForbiddenException);
        expect(tagDao.getByIds).not.toHaveBeenCalled();
        expect(transferDao.save).not.toHaveBeenCalled();
        expect(transferDao.setTags).not.toHaveBeenCalled();
    });

    it('allows tagging a transfer received by one of the user accounts', async () => {
        transferDao.getById.mockResolvedValue(
            Object.assign(new Transfer(), {
                id: 3,
                ownerUserId: 8,
                originAccount: { userId: 8 },
                targetAccount: { userId: 7 },
            }),
        );
        tagDao.getByIds.mockResolvedValue([tag]);
        await controller.setTransferTags(7, 3, { tagIds: [1] });
        expect(transferDao.setTags).toHaveBeenCalledWith(3, [tag]);
    });

    it('validates the complete assignment before saving an item', async () => {
        const item = Object.assign(new Item(), { id: 2, tags: [tag] });
        itemDao.getById.mockResolvedValue(item);
        tagDao.getByIds.mockRejectedValue(new Error('Unknown tag'));
        await expect(controller.setItemTags(2, { tagIds: [99] })).rejects.toThrow('Unknown tag');
        expect(itemDao.save).not.toHaveBeenCalled();
        expect(item.tags).toEqual([tag]);
    });

    it('preserves legacy assign idempotency using tag ID membership', async () => {
        const item = Object.assign(new Item(), { id: 2, name: 'Milk', tags: [{ ...tag }] });
        itemDao.getById.mockResolvedValue(item);
        tagDao.getById.mockResolvedValue(tag);
        await controller.assignTagToItem(2, { tagId: 1 });
        expect(item.tags).toHaveLength(1);
        expect(itemDao.save).not.toHaveBeenCalled();
    });
});
