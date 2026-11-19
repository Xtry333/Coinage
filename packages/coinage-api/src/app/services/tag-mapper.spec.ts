import { TagDTO, effectiveTags, unionEffectiveTags, uniqueTags } from '@app/interfaces';

import { Item } from '../entities/Item.entity';
import { Tag } from '../entities/Tag.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { getReceiptTags, getTransferTags } from './tag-mapper';

const holiday: Tag = Object.assign(new Tag(), { id: 1, name: 'Holiday', color: '#112233' });
const food: Tag = Object.assign(new Tag(), { id: 2, name: 'Food', color: null });

function transfer(direct: Tag[] = [], items: Tag[][] = []): Transfer {
    return Object.assign(new Transfer(), {
        tags: direct,
        transferItems: items.map((tags) => Object.assign(new TransferItem(), { item: Object.assign(new Item(), { tags }) })),
    });
}

describe('tag sets and effective tag DTOs', () => {
    it('returns empty collections for transfers and receipts without tags', () => {
        expect(getTransferTags(new Transfer())).toEqual([]);
        expect(getReceiptTags()).toEqual([]);
        expect(getReceiptTags([new Transfer()])).toEqual([]);
    });

    it('uses ID equality, not object reference equality, and orders tags consistently', () => {
        expect(uniqueTags([holiday, { ...holiday }, food, { ...food }])).toEqual([
            { id: 2, name: 'Food', color: null },
            { id: 1, name: 'Holiday', color: '#112233' },
        ]);
    });

    it('deduplicates a tag inherited from multiple items and repeated item lines', () => {
        expect(getTransferTags(transfer([], [[holiday], [{ ...holiday }], [holiday, food]]))).toEqual([
            { ...food, isDirect: false, isInherited: true },
            { id: 1, name: 'Holiday', color: '#112233', isDirect: false, isInherited: true },
        ]);
    });

    it('keeps a direct assignment when a tagged item is added later, without mutating storage', () => {
        const entity = transfer([holiday]);
        const stored = entity.tags;
        expect(getTransferTags(entity)).toEqual([{ ...holiday, isDirect: true, isInherited: false }]);

        entity.transferItems = transfer([], [[holiday]]).transferItems;
        expect(getTransferTags(entity)).toEqual([{ ...holiday, isDirect: true, isInherited: true }]);
        expect(entity.tags).toBe(stored);
        expect(entity.tags).toEqual([holiday]);

        entity.tags = [];
        expect(getTransferTags(entity)).toEqual([{ ...holiday, isDirect: false, isInherited: true }]);
    });

    it('recalculates inheritance after item tags or membership change', () => {
        const entity = transfer([food], [[holiday], [holiday]]);
        entity.transferItems[0].item.tags = [];
        expect(getTransferTags(entity).map((tag) => tag.id)).toEqual([2, 1]);
        entity.transferItems.splice(1, 1);
        expect(getTransferTags(entity)).toEqual([{ ...food, isDirect: true, isInherited: false }]);
        expect(entity.tags).toEqual([food]);
    });

    it('deduplicates a receipt union while preserving both kinds of source', () => {
        const a = transfer([holiday], [[food]]);
        const b = transfer([food], [[holiday], [holiday]]);
        const tags = getReceiptTags([a, b, b]);
        expect(tags).toEqual([
            { ...food, isDirect: true, isInherited: true },
            { ...holiday, isDirect: true, isInherited: true },
        ]);
        expect(a.tags).toEqual([holiday]);
        expect(b.tags).toEqual([food]);
    });

    it('never leaks entity relations or writes calculated tags back onto the entity', () => {
        const entity = transfer([Object.assign(new Tag(), holiday, { items: [] })], [[food]]);
        const serialized = JSON.parse(JSON.stringify(getTransferTags(entity)));
        expect(serialized).toEqual([
            { id: 2, name: 'Food', color: null, isDirect: false, isInherited: true },
            { id: 1, name: 'Holiday', color: '#112233', isDirect: true, isInherited: false },
        ]);
        expect(entity.tags).toHaveLength(1);
    });

    it('shares the same set semantics with the UI preview', () => {
        const direct: TagDTO[] = [holiday, holiday];
        const tags = effectiveTags(direct, [[holiday, food], [holiday]]);
        expect(unionEffectiveTags([tags, tags])).toEqual(tags);
    });
});
