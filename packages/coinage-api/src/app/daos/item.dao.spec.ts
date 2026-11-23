import { Repository } from 'typeorm';

import { Item } from '../entities/Item.entity';
import { ItemDao } from './item.dao';

describe('item picker tag projection', () => {
    it('returns tags with the last-used-price rows, including never-used items', async () => {
        const tags = [{ id: 1, name: 'Food', color: null }];
        const query = jest.fn().mockResolvedValue([
            {
                id: 2,
                name: 'Milk',
                brand: null,
                category_id: 5,
                container_size: null,
                container_size_unit: null,
                last_used_date: null,
                last_unit_price: null,
                tags,
            },
        ]);
        const dao = new ItemDao({ query } as unknown as Repository<Item>);
        const [item] = await dao.getAllWithLastUsedPrice();
        expect(item.tags).toEqual(tags);
        expect(item.lastUsedDate).toBeNull();
        expect(query.mock.calls[0][0]).toContain("'[]'::jsonb");
        expect(query.mock.calls[0][0]).toContain('FROM item_tag it JOIN tag t');
        expect(query.mock.calls[0][0]).toContain('WHERE NOT i.is_archived');
    });
});
