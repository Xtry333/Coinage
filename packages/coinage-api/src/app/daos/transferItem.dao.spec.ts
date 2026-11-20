import { Equal, IsNull, Repository } from 'typeorm';

import { TransferItemDao } from './transferItem.dao';
import { Container } from '../entities/Container.entity';
import { Item } from '../entities/Item.entity';
import { TransferItem } from '../entities/TransferItem.entity';

describe('TransferItemDao', () => {
    let dao: TransferItemDao;
    let repository: Repository<TransferItem>;
    let save: jest.Mock;
    let findOneBy: jest.Mock;

    beforeEach(() => {
        save = jest.fn().mockImplementation(async (entity) => entity);
        findOneBy = jest.fn().mockResolvedValue(null);
        repository = { save, findOneBy } as unknown as Repository<TransferItem>;
        dao = new TransferItemDao(repository);
    });

    describe('save', () => {
        it.each([1, null])('persists containerId %s without the stale loaded relations', async (containerId) => {
            const transferItem = Object.assign(new TransferItem(), {
                id: 2058,
                transferId: 3793,
                itemId: 380,
                containerId,
                packagingId: null,
                quantity: 3,
                unitPrice: 23.1,
                totalSetPrice: 69.3,
                totalSetDiscount: 0,
                item: Object.assign(new Item(), { id: 380 }),
                container: Promise.resolve(Object.assign(new Container(), { id: 5 })),
            });

            await dao.save(transferItem);

            expect(save).toHaveBeenCalledWith({
                id: 2058,
                transferId: 3793,
                itemId: 380,
                containerId,
                packagingId: null,
                quantity: 3,
                unitPrice: 23.1,
                totalSetPrice: 69.3,
                totalSetDiscount: 0,
            });
            expect(save.mock.calls[0][0]).not.toHaveProperty('container');
            expect(save.mock.calls[0][0]).not.toHaveProperty('item');
        });
    });

    describe('findUnique', () => {
        it('distinguishes two sizes using the same shared container', async () => {
            await dao.findUnique(3793, 380, 23.1, 1, 9);
            expect(findOneBy).toHaveBeenCalledWith(expect.objectContaining({ containerId: Equal(1), packagingId: Equal(9) }));
        });
        it('distinguishes containers for the same item and price', async () => {
            await dao.findUnique(3793, 380, 23.1, 1);

            expect(findOneBy).toHaveBeenCalledWith({
                transferId: Equal(3793),
                itemId: Equal(380),
                unitPrice: Equal(23.1),
                containerId: Equal(1),
                packagingId: IsNull(),
            });
        });

        it('only matches rows without a container when no container is selected', async () => {
            await dao.findUnique(3793, 380, 23.1, null);

            expect(findOneBy).toHaveBeenCalledWith({
                transferId: Equal(3793),
                itemId: Equal(380),
                unitPrice: Equal(23.1),
                containerId: IsNull(),
                packagingId: IsNull(),
            });
        });
    });
});
