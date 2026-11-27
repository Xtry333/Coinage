import { EventBus } from '@nestjs/cqrs';
import { createSpyFromClass } from 'jest-auto-spies';

import {
    CreateEditTransferModelDTO,
    CreateMultipleTransfersDTO,
    ExistingItem,
    GranularCreateEditTransferModelDTO,
    GranularTransferItemChanges,
    ShoppingListItem,
} from '@app/interfaces';

import { ReceiptsController } from './receipts.controller';
import { TransferController } from './transfer.controller';
import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ItemDao } from '../daos/item.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { TagDao } from '../daos/tag.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Account } from '../entities/Account.entity';
import { Category, TransferTypeEnum } from '../entities/Category.entity';
import { Item } from '../entities/Item.entity';
import { Receipt } from '../entities/Receipt.entity';
import { Transfer } from '../entities/Transfer.entity';
import { User } from '../entities/User.entity';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { ItemPackagingService } from '../services/item-packaging.service';
import { ItemsService } from '../services/items.service';
import { TransferItemsService } from '../services/transfer-items.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';
import { TransfersService } from '../services/transfers.service';

describe('signed items across transfer and receipt endpoints', () => {
    function setup() {
        const accounts = createSpyFromClass(AccountDao);
        const categories = createSpyFromClass(CategoryDao);
        const contractors = createSpyFromClass(ContractorDao);
        const receipts = createSpyFromClass(ReceiptDao);
        const items = createSpyFromClass(ItemDao);
        const transferDao = createSpyFromClass(TransferDao);
        const transferItems = createSpyFromClass(TransferItemsService);
        const itemsService = createSpyFromClass(ItemsService);
        const tags = createSpyFromClass(TagDao);
        const packaging = createSpyFromClass(ItemPackagingService);
        const user = Object.assign(new User(), { id: 7 });
        const account = Object.assign(new Account(), { id: 1, userId: 7, name: 'Cash', currency: { symbol: 'PLN' } });
        const external = Object.assign(new Account(), { id: 17, userId: null, name: 'Shop', currency: account.currency });
        const category = Object.assign(new Category(), { id: 2, name: 'Deposits', type: TransferTypeEnum.OUTCOME });
        const receipt: Receipt = Object.assign(new Receipt(), { id: 4, transfers: [] });
        const item = Object.assign(new Item(), { id: 10, name: 'Kaucja', categoryId: 2, kindCode: 'PRODUCT' });
        const saved = new Map<number, Transfer>();
        accounts.getById.mockImplementation(async (id) => (id === 17 ? external : account));
        categories.getById.mockResolvedValue(category);
        categories.getBySystemTag.mockResolvedValue(Object.assign(new Category(), { id: 3, name: 'Refund', type: TransferTypeEnum.INCOME }));
        receipts.getById.mockResolvedValue(receipt);
        receipts.save.mockImplementation(async (value) => value);
        items.getById.mockResolvedValue(item);
        itemsService.getByIds.mockResolvedValue([item]);
        packaging.resolve.mockResolvedValue(null);
        transferItems.getTransferItems.mockResolvedValue([]);
        transferItems.save.mockImplementation(async (line) => line);
        transferDao.save.mockImplementation(async (value) => {
            value.id ??= saved.size + 1;
            value.originAccount ??= value.originAccountId === 17 ? external : account;
            value.targetAccount ??= value.targetAccountId === 17 ? external : account;
            value.category ??= category;
            saved.set(value.id, value as Transfer);
            return value as Transfer;
        });
        const transfers = new TransfersService(transferDao, categories);
        const receiptController = new ReceiptsController(
            receipts,
            createSpyFromClass(EventBus),
            accounts,
            categories,
            contractors,
            items,
            transfers,
            packaging,
        );
        const transferController = new TransferController(
            transferDao,
            transfers,
            createSpyFromClass(EtherealTransferService),
            categories,
            contractors,
            accounts,
            receipts,
            createSpyFromClass(DateParserService),
            createSpyFromClass(SaveTransfersService),
            itemsService,
            transferItems,
            tags,
        );
        return {
            accounts,
            account,
            external,
            user,
            categories,
            receipts,
            receipt,
            items,
            item,
            itemsService,
            receiptController,
            transferController,
            transferDao,
            transferItems,
            saved,
        };
    }

    it.each([
        { prices: [0.5, -0.5], quantities: [4, 4], subtotal: 0 },
        { prices: [0.5, -0.5], quantities: [6, 4], subtotal: 1 },
    ])('preserves repeated receipt lines when their subtotal is $subtotal', async ({ prices, quantities, subtotal }) => {
        const context = setup();
        await context.receiptController.confirmReceipt(context.user, 4, {
            originAccountId: 1,
            date: '2026-11-27',
            contractorId: null,
            items: prices.map((price, index) => ({ itemId: 10, name: 'Kaucja', price, quantity: quantities[index], isNew: false, included: true })),
        });
        const transfer = [...context.saved.values()][0];
        expect(transfer.amount).toBe(subtotal);
        expect(transfer.originAccountId).toBe(1);
        expect(transfer.targetAccountId).toBe(17);
        expect(transfer.transferItems.map((line) => line.unitPrice)).toEqual(prices);
        expect(transfer.transferItems.map((line) => line.quantity)).toEqual(quantities);
        expect(context.receipt.amount).toBe(subtotal);
        context.receipt.transfers = [transfer];
        const details = await context.receiptController.getReceiptDetails(4);
        expect(details.totalTransferred).toBe(subtotal);
        expect(details.totalAmount).toBe(subtotal);
    });

    it('rounds individual receipt lines before adding the category and receipt totals', async () => {
        const context = setup();
        await context.receiptController.confirmReceipt(context.user, 4, {
            originAccountId: 1,
            date: '2026-11-27',
            contractorId: null,
            items: [
                ...[1, 2].map(() => ({ itemId: 10, name: 'Product', price: -0.5, quantity: 2.01, isNew: false, included: true })),
                { itemId: 10, name: 'Product', price: 3, quantity: 1, isNew: false, included: true },
            ],
        });
        const transfer = [...context.saved.values()][0];
        expect(transfer.amount).toBe(0.98);
        expect(transfer.transferItems.map((line) => line.totalSetPrice)).toEqual([-1.01, -1.01, 3]);
        expect(context.receipt.amount).toBe(0.98);
    });

    it('rejects a negative receipt category before creating any transfers', async () => {
        const context = setup();
        const receiptBefore = JSON.stringify(context.receipt);
        await expect(
            context.receiptController.confirmReceipt(context.user, 4, {
                originAccountId: 1,
                date: '2026-11-27',
                contractorId: null,
                items: [{ itemId: 10, name: 'Product', price: -0.5, quantity: 6, isNew: false, included: true }],
            }),
        ).rejects.toThrow('must not be negative');
        expect(context.transferDao.save).not.toHaveBeenCalled();
        expect(context.receipts.save).not.toHaveBeenCalled();
        expect(JSON.stringify(context.receipt)).toBe(receiptBefore);
        expect(context.account.id).toBe(1);
    });

    it('preflights every receipt category even when the receipt total is positive', async () => {
        const context = setup();
        context.items.getById.mockImplementation(async (id) => Object.assign(new Item(), { id, categoryId: id === 10 ? 2 : 3 }));
        await expect(
            context.receiptController.confirmReceipt(context.user, 4, {
                originAccountId: 1,
                date: '2026-11-27',
                contractorId: null,
                items: [
                    { itemId: 10, name: 'Bottles', price: 10, quantity: 1, isNew: false, included: true },
                    { itemId: 11, name: 'Deposit credit', price: -3, quantity: 1, isNew: false, included: true },
                ],
            }),
        ).rejects.toThrow('must not be negative');
        expect(context.transferDao.save).not.toHaveBeenCalled();
        expect(context.receipts.save).not.toHaveBeenCalled();
    });

    it('does not discard the second occurrence of an item in advanced entry', async () => {
        const context = setup();
        await context.transferController.createTransfersFromAdvancedObject(
            context.user,
            new CreateMultipleTransfersDTO('Deposits', 1, 2, null, 1, new Date(), null, [
                new ExistingItem(10, 6, 0.5, 3, 0),
                new ExistingItem(10, 4, -0.5, -2, 0),
            ]),
        );
        const transfer = [...context.saved.values()][0];
        expect(transfer).toMatchObject({ amount: 1, originAccountId: 1, targetAccountId: 17 });
        expect(transfer.transferItems.map((line) => line.totalSetPrice)).toEqual([3, -2]);
    });

    it('preflights every advanced-entry category before writing any transfers', async () => {
        const context = setup();
        context.itemsService.getByIds.mockResolvedValue([context.item, Object.assign(new Item(), { id: 11, categoryId: 3 })]);
        await expect(
            context.transferController.createTransfersFromAdvancedObject(
                context.user,
                new CreateMultipleTransfersDTO('Shopping', 7, 2, null, 1, new Date(), null, [
                    new ExistingItem(10, 1, 10, 10, 0),
                    new ExistingItem(11, 1, -3, -3, 0),
                ]),
            ),
        ).rejects.toThrow('must not be negative');
        expect(context.transferDao.save).not.toHaveBeenCalled();
    });

    it('allows a zero advanced-entry total despite floating-point subtraction', async () => {
        const context = setup();
        await context.transferController.createTransfersFromAdvancedObject(
            context.user,
            new CreateMultipleTransfersDTO('Shopping', 0, 2, null, 1, new Date(), null, [
                new ExistingItem(10, 1, 0.3, 0.3, 0),
                new ExistingItem(10, 1, -0.1, -0.1, 0),
                new ExistingItem(10, 1, -0.2, -0.2, 0),
            ]),
        );
        expect([...context.saved.values()][0]).toMatchObject({ amount: 0, originAccountId: 1, targetAccountId: 17 });
    });

    it.each(['full', 'granular'])('preserves negative product lines in %s saves', async (mode) => {
        const context = setup();
        const line = new ShoppingListItem(10, 'Product', 6, -0.5, -3, 0, 2);
        const positiveLine = new ShoppingListItem(10, 'Product', 1, 5, 5, 0, 2);
        if (mode === 'full') {
            await context.transferController.saveTransferObject(
                context.user,
                new CreateEditTransferModelDTO(undefined, 'Shopping', 2, 2, null, 1, new Date(), null, [positiveLine, line], 17),
            );
        } else {
            context.transferDao.getById.mockResolvedValue(Object.assign(new Transfer(), { id: 1, ownerUserId: 7 }));
            await context.transferController.saveTransferObjectGranular(
                context.user,
                new GranularCreateEditTransferModelDTO(
                    1,
                    'Shopping',
                    2,
                    2,
                    null,
                    1,
                    new Date(),
                    null,
                    new GranularTransferItemChanges([positiveLine, line], [], []),
                    17,
                ),
            );
        }
        const transfer = [...context.saved.values()][0];
        expect(transfer).toMatchObject({ amount: 2, originAccountId: 1, targetAccountId: 17, metadata: {} });
        expect(context.transferItems.save).toHaveBeenCalledWith(expect.objectContaining({ unitPrice: -0.5, totalSetPrice: -3, quantity: 6 }));
    });

    it('refunds the entire positive transfer using reversed accounts, currency and owner', async () => {
        const context = setup();
        const original = Object.assign(new Transfer(), {
            id: 12,
            amount: 19,
            description: 'Shopping',
            originAccountId: 1,
            targetAccountId: 17,
            originAccount: context.account,
            targetAccount: context.external,
            ownerUserId: 7,
            receiptId: 4,
            currency: context.account.currency,
            transferItems: [],
        });
        context.transferDao.getById.mockResolvedValue(original);
        await context.transferController.refundTransfer(12, { refundTargetId: 12, refundDate: '2026-11-27' });
        const refund = [...context.saved.values()].find((transfer) => transfer.id !== 12);
        expect(refund).toMatchObject({
            amount: 19,
            originAccountId: 17,
            targetAccountId: 1,
            currency: { symbol: 'PLN' },
            ownerUserId: 7,
            receiptId: 4,
            metadata: { refundTargetId: 12 },
        });
        expect(original).toMatchObject({ amount: 19, originAccountId: 1, targetAccountId: 17, transferItems: [] });
        await expect(context.transferController.refundTransfer(12, { refundTargetId: 12, refundDate: '2026-11-27' })).rejects.toThrow('Cannot refund');
    });

    it.each(['full', 'granular', 'advanced'])('rejects negative transfer requests in %s saves without writing items or transfers', async (mode) => {
        const context = setup();
        const existing = Object.assign(new Transfer(), { id: 1, amount: 4, originAccountId: 1, targetAccountId: 17, ownerUserId: 7 });
        const before = JSON.stringify(existing);
        context.transferDao.getById.mockResolvedValue(existing);
        const save = () => {
            if (mode === 'full')
                return context.transferController.saveTransferObject(
                    context.user,
                    new CreateEditTransferModelDTO(1, 'Return', -3, 2, null, 1, new Date(), null, [], 17),
                );
            if (mode === 'advanced')
                return context.transferController.createTransfersFromAdvancedObject(
                    context.user,
                    new CreateMultipleTransfersDTO('Return', -3, 2, null, 1, new Date(), null, [new ExistingItem(10, 1, -3, -3, 0)]),
                );
            return context.transferController.saveTransferObjectGranular(
                context.user,
                new GranularCreateEditTransferModelDTO(1, 'Return', -3, 2, null, 1, new Date(), null, new GranularTransferItemChanges([], [], [5]), 17),
            );
        };
        for (let attempt = 0; attempt < 2; attempt++) {
            await expect(save()).rejects.toThrow('must not be negative');
            expect(JSON.stringify(existing)).toBe(before);
        }
        expect(context.transferDao.save).not.toHaveBeenCalled();
        expect(context.transferItems.save).not.toHaveBeenCalled();
        expect(context.transferItems.deleteTransferItems).not.toHaveBeenCalled();
    });
});
