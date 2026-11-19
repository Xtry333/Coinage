import { createSpyFromClass, Spy } from 'jest-auto-spies';

import { CreateEditTransferModelDTO, GranularCreateEditTransferModelDTO, GranularTransferItemChanges } from '@app/interfaces';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { TagDao } from '../daos/tag.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Account } from '../entities/Account.entity';
import { Category } from '../entities/Category.entity';
import { Tag } from '../entities/Tag.entity';
import { Transfer } from '../entities/Transfer.entity';
import { User } from '../entities/User.entity';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { ItemsService } from '../services/items.service';
import { TransferItemsService } from '../services/transfer-items.service';
import { TransfersService } from '../services/transfers.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';
import { TransferController } from './transfer.controller';

describe('direct tags in full and granular transfer saves', () => {
    let controller: TransferController;
    let tagDao: Spy<TagDao>;
    let transfers: Spy<TransfersService>;
    let entity: Transfer;
    const tag = Object.assign(new Tag(), { id: 1, name: 'Holiday', color: null });
    const user = Object.assign(new User(), { id: 7 });

    beforeEach(() => {
        const transferDao = createSpyFromClass(TransferDao);
        const categoryDao = createSpyFromClass(CategoryDao);
        const accountDao = createSpyFromClass(AccountDao);
        const transferItems = createSpyFromClass(TransferItemsService);
        transfers = createSpyFromClass(TransfersService);
        tagDao = createSpyFromClass(TagDao);
        entity = Object.assign(new Transfer(), { id: 3, tags: [tag], ownerUserId: 7 });
        transferDao.getById.mockResolvedValue(entity);
        categoryDao.getById.mockResolvedValue(Object.assign(new Category(), { id: 2, name: 'Food', type: 'OUTCOME' }));
        accountDao.getById.mockResolvedValue(Object.assign(new Account(), { id: 7, currency: { symbol: 'PLN' } }));
        transferItems.getTransferItems.mockResolvedValue([]);
        transfers.saveTransfer.mockImplementation(async (value) => value);
        tagDao.getByIds.mockResolvedValue([]);
        controller = new TransferController(
            transferDao,
            transfers,
            createSpyFromClass(EtherealTransferService),
            categoryDao,
            createSpyFromClass(ContractorDao),
            accountDao,
            createSpyFromClass(ReceiptDao),
            createSpyFromClass(DateParserService),
            createSpyFromClass(SaveTransfersService),
            createSpyFromClass(ItemsService),
            transferItems,
            tagDao,
        );
    });

    function fullRequest(tagIds?: number[]): CreateEditTransferModelDTO {
        return new CreateEditTransferModelDTO(3, 'Lunch', 10, 2, null, 7, new Date(), null, [], null, tagIds);
    }

    function granularRequest(tagIds?: number[]): GranularCreateEditTransferModelDTO {
        return new GranularCreateEditTransferModelDTO(3, 'Lunch', 10, 2, null, 7, new Date(), null, new GranularTransferItemChanges([], [], []), null, tagIds);
    }

    it.each(['full', 'granular'])('preserves direct tags when an older %s client omits tagIds', async (mode) => {
        if (mode === 'full') await controller.saveTransferObject(user, fullRequest());
        else await controller.saveTransferObjectGranular(user, granularRequest());
        expect(entity.tags).toEqual([tag]);
        expect(tagDao.getByIds).not.toHaveBeenCalled();
    });

    it.each(['full', 'granular'])('clears only direct tags when the %s request sends an empty set', async (mode) => {
        if (mode === 'full') await controller.saveTransferObject(user, fullRequest([]));
        else await controller.saveTransferObjectGranular(user, granularRequest([]));
        expect(entity.tags).toEqual([]);
        expect(tagDao.getByIds).toHaveBeenCalledWith([]);
        expect(transfers.saveTransfer).toHaveBeenCalledWith(entity);
    });

    it.each(['full', 'granular'])('validates unknown tags before any %s transfer writes', async (mode) => {
        tagDao.getByIds.mockRejectedValue(new Error('Unknown tag'));
        const save =
            mode === 'full' ? controller.saveTransferObject(user, fullRequest([99])) : controller.saveTransferObjectGranular(user, granularRequest([99]));
        await expect(save).rejects.toThrow('Unknown tag');
        expect(transfers.saveTransfer).not.toHaveBeenCalled();
        expect(entity.tags).toEqual([tag]);
    });
});
