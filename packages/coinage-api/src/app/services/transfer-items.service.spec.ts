import { createSpyFromClass, Spy } from 'jest-auto-spies';

import { TransferItemDao } from '../daos/transferItem.dao';
import { TransferItem } from '../entities/TransferItem.entity';
import { TransferItemsService } from './transfer-items.service';

function makeMockTransferItem(overrides: Partial<TransferItem> = {}): TransferItem {
    const item = new TransferItem();
    item.transferId = 1;
    item.itemId = 10;
    item.unitPrice = 5.0;
    item.quantity = 2;
    item.totalSetPrice = 10.0;
    item.totalSetDiscount = 0;
    item.containerId = null;
    return Object.assign(item, overrides);
}

describe('TransferItemsService', () => {
    let service: TransferItemsService;
    let transferItemDao: Spy<TransferItemDao>;

    beforeEach(() => {
        transferItemDao = createSpyFromClass(TransferItemDao);
        service = new TransferItemsService(transferItemDao);
    });

    describe('save', () => {
        it('calls getById when item.id is defined', async () => {
            const input = makeMockTransferItem({ id: 42 });
            const entity = makeMockTransferItem({ id: 42 });
            transferItemDao.getById.mockResolvedValue(entity);
            transferItemDao.save.mockResolvedValue(entity);

            await service.save(input);

            expect(transferItemDao.getById).toHaveBeenCalledWith(42);
            expect(transferItemDao.findUnique).not.toHaveBeenCalled();
        });

        it('calls findUnique when item.id is undefined', async () => {
            const input = makeMockTransferItem();
            const found = makeMockTransferItem({ id: 7 });
            transferItemDao.findUnique.mockResolvedValue(found);
            transferItemDao.save.mockResolvedValue(found);

            await service.save(input);

            expect(transferItemDao.findUnique).toHaveBeenCalledWith(input.transferId, input.itemId, input.unitPrice);
            expect(transferItemDao.getById).not.toHaveBeenCalled();
        });

        it('creates a new TransferItem when findUnique returns null', async () => {
            const input = makeMockTransferItem();
            const saved = makeMockTransferItem({ id: 99 });
            transferItemDao.findUnique.mockResolvedValue(null);
            transferItemDao.save.mockResolvedValue(saved);

            const result = await service.save(input);

            expect(transferItemDao.save).toHaveBeenCalled();
            expect(result).toBe(saved);
        });

        it('copies all fields from input onto the entity before saving', async () => {
            const input = makeMockTransferItem({
                transferId: 3,
                itemId: 20,
                unitPrice: 9.99,
                quantity: 3,
                totalSetPrice: 29.97,
                totalSetDiscount: 1.0,
                containerId: 5,
            });
            const existing = makeMockTransferItem({ id: 50 });
            transferItemDao.findUnique.mockResolvedValue(existing);
            transferItemDao.save.mockImplementation(async (e) => e as TransferItem);

            await service.save(input);

            const savedEntity = transferItemDao.save.mock.calls[0][0] as TransferItem;
            expect(savedEntity.transferId).toBe(3);
            expect(savedEntity.itemId).toBe(20);
            expect(savedEntity.unitPrice).toBe(9.99);
            expect(savedEntity.quantity).toBe(3);
            expect(savedEntity.totalSetPrice).toBe(29.97);
            expect(savedEntity.totalSetDiscount).toBe(1.0);
            expect(savedEntity.containerId).toBe(5);
        });

        it('returns the saved entity from the DAO', async () => {
            const input = makeMockTransferItem({ id: 1 });
            const saved = makeMockTransferItem({ id: 1, unitPrice: 99 });
            transferItemDao.getById.mockResolvedValue(makeMockTransferItem({ id: 1 }));
            transferItemDao.save.mockResolvedValue(saved);

            const result = await service.save(input);

            expect(result).toBe(saved);
        });

        it('re-throws errors from the DAO', async () => {
            const input = makeMockTransferItem({ id: 1 });
            transferItemDao.getById.mockRejectedValue(new Error('DB error'));

            await expect(service.save(input)).rejects.toThrow('DB error');
        });
    });

    describe('removeTransferItemsForTransferId', () => {
        it('delegates to transferItemDao.removeTransferItemsForTransferId with the given ID', () => {
            const mockResult = Promise.resolve();
            transferItemDao.removeTransferItemsForTransferId.mockReturnValue(mockResult as any);

            const ret = service.removeTransferItemsForTransferId(5);

            expect(transferItemDao.removeTransferItemsForTransferId).toHaveBeenCalledWith(5);
            expect(ret).toBe(mockResult);
        });
    });

    describe('getTransferItems', () => {
        it('delegates to transferItemDao.findByTransferId and returns the result', async () => {
            const items = [makeMockTransferItem({ id: 1 }), makeMockTransferItem({ id: 2 })];
            transferItemDao.findByTransferId.mockResolvedValue(items);

            const result = await service.getTransferItems(10);

            expect(transferItemDao.findByTransferId).toHaveBeenCalledWith(10);
            expect(result).toBe(items);
        });
    });

    describe('deleteTransferItems', () => {
        it('delegates to transferItemDao.deleteByIds and returns deleted count', async () => {
            transferItemDao.deleteByIds.mockResolvedValue(3);

            const result = await service.deleteTransferItems([1, 2, 3]);

            expect(transferItemDao.deleteByIds).toHaveBeenCalledWith([1, 2, 3]);
            expect(result).toBe(3);
        });
    });
});
