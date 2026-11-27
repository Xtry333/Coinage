import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ConfirmReceiptDTO, CreateEditTransferModelDTO, CreateMultipleTransfersDTO, GranularCreateEditTransferModelDTO } from '@app/interfaces';

describe('signed item request validation', () => {
    const common = {
        amount: 3,
        originAccountId: 1,
        categoryId: 2,
        mainCategoryId: 2,
        date: new Date('2026-11-27'),
        contractorId: null,
        receiptId: null,
    };
    const line = { id: 1, name: 'Ordinary product', amount: 6, price: -0.5, totalPrice: -3, setDiscount: 0, categoryId: 2 };

    it('accepts negative product prices within a nonnegative transfer', async () => {
        const request = plainToInstance(CreateEditTransferModelDTO, { ...common, items: [line] });
        expect(await validate(request)).toEqual([]);
    });

    it.each([-3, -0.01])('rejects a transfer amount of %s in all save DTOs', async (amount) => {
        const requests = [
            plainToInstance(CreateEditTransferModelDTO, { ...common, amount, items: [line] }),
            plainToInstance(GranularCreateEditTransferModelDTO, {
                ...common,
                amount,
                id: 3,
                itemChanges: { addedItems: [line], editedItems: [], removedItemIds: [] },
            }),
            plainToInstance(CreateMultipleTransfersDTO, {
                ...common,
                amount,
                items: [{ itemId: 1, quantity: 6, unitPrice: -0.5, totalSetPrice: -3, totalSetDiscount: 0 }],
            }),
        ];
        for (const request of requests) {
            expect(await validate(request)).toEqual(
                expect.arrayContaining([expect.objectContaining({ property: 'amount', constraints: { min: expect.any(String) } })]),
            );
        }
    });

    it('allows zero transfer amounts in all save DTOs', async () => {
        const requests = [
            plainToInstance(CreateEditTransferModelDTO, { ...common, amount: 0, items: [line] }),
            plainToInstance(GranularCreateEditTransferModelDTO, {
                ...common,
                amount: 0,
                id: 3,
                itemChanges: { addedItems: [line], editedItems: [], removedItemIds: [] },
            }),
            plainToInstance(CreateMultipleTransfersDTO, {
                ...common,
                amount: 0,
                items: [{ itemId: 1, quantity: 6, unitPrice: -0.5, totalSetPrice: -3, totalSetDiscount: 0 }],
            }),
        ];
        for (const request of requests) expect(await validate(request)).toEqual([]);
    });

    it('validates signed lines nested in granular edits', async () => {
        const request = plainToInstance(GranularCreateEditTransferModelDTO, {
            ...common,
            id: 3,
            itemChanges: { addedItems: [line], editedItems: [], removedItemIds: [] },
        });
        expect(await validate(request)).toEqual([]);
        request.itemChanges.addedItems[0].price = NaN;
        expect(await validate(request)).not.toEqual([]);
    });

    it('accepts signed advanced-entry prices but rejects negative quantities', async () => {
        const request = plainToInstance(CreateMultipleTransfersDTO, {
            ...common,
            items: [{ itemId: 1, quantity: 6, unitPrice: -0.5, totalSetPrice: -3, totalSetDiscount: 0 }],
        });
        expect(await validate(request)).toEqual([]);
        request.items[0].quantity = -6;
        expect(await validate(request)).not.toEqual([]);
    });

    it('validates receipt confirmation lines, allowing negative and zero prices', async () => {
        const request = plainToInstance(ConfirmReceiptDTO, {
            originAccountId: 1,
            date: '2026-11-27',
            contractorId: null,
            items: [
                { itemId: 1, name: 'Product', price: -0.5, quantity: 6, isNew: false, included: true },
                { itemId: 2, name: 'Free product', price: 0, quantity: 1, isNew: false, included: true },
            ],
        });
        expect(await validate(request)).toEqual([]);
        request.items[0].price = Infinity;
        expect(await validate(request)).not.toEqual([]);
    });
});
