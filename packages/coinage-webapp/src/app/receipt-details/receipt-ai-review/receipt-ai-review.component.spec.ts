import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { of } from 'rxjs';

import { NormalizedReceiptItemDTO } from '@app/interfaces';

import { ReceiptAiReviewComponent } from './receipt-ai-review.component';
import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

describe('signed receipt review', () => {
    function setup() {
        const confirmReceipt = jest.fn().mockResolvedValue({});
        const data = { getAllAvailableAccounts: () => of([]), confirmReceipt } as unknown as CoinageDataService;
        const notifications = { push: jest.fn() };
        const component = new ReceiptAiReviewComponent(data, notifications as unknown as NotificationService, {} as HttpClient, {} as DomSanitizer);
        const base: NormalizedReceiptItemDTO = {
            itemId: 10,
            isNew: false,
            name: 'Kaucja',
            brand: null,
            categoryId: 2,
            price: 0.5,
            quantity: 4,
            suggestedContainer: null,
            historicalContainers: [],
            containerConfidence: 'none',
            needsContainerConfirmation: false,
        };
        component.receiptId = 4;
        component.aiData = {
            raw: {},
            normalized: {
                date: '2026-11-27',
                contractorId: null,
                contractorName: null,
                isNewContractor: false,
                items: [base, { ...base, price: -0.5, quantity: 6 }],
            },
        };
        component.ngOnInit();
        return { component, confirmReceipt, notifications };
    }

    it.each([4, 6])('keeps repeated signed lines with nonnegative totals (returned quantity: %s)', async (returnedQuantity) => {
        const { component, confirmReceipt } = setup();
        component.items[0].quantity = 6;
        component.onQtyChange(component.items[0]);
        component.items[1].quantity = returnedQuantity;
        component.onQtyChange(component.items[1]);
        expect(component.totalAmount).toBe((6 - returnedQuantity) * 0.5);
        component.selectedOriginAccountId = 1;
        await component.onConfirm();
        expect(confirmReceipt).toHaveBeenCalledWith(
            4,
            expect.objectContaining({
                originAccountId: 1,
                items: [
                    expect.objectContaining({ itemId: 10, price: 0.5, quantity: 6 }),
                    expect.objectContaining({ itemId: 10, price: -0.5, quantity: returnedQuantity }),
                ],
            }),
        );
    });

    it('blocks a negative receipt total without submitting or changing accounts', async () => {
        const { component, confirmReceipt, notifications } = setup();
        component.selectedOriginAccountId = 1;
        await component.onConfirm();
        expect(confirmReceipt).not.toHaveBeenCalled();
        expect(component.selectedOriginAccountId).toBe(1);
        expect(component.totalAmount).toBe(-1);
        expect(notifications.push).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('cannot have negative totals') }));
    });

    it('displays the API rejection when a category total is negative despite a positive receipt total', async () => {
        const { component, confirmReceipt, notifications } = setup();
        component.items[0].price = 5;
        component.onPriceChange(component.items[0]);
        component.selectedOriginAccountId = 1;
        const message = 'Transfer amount must not be negative. Use an explicit refund for returns.';
        confirmReceipt.mockRejectedValue(new HttpErrorResponse({ status: 400, error: { message } }));
        await component.onConfirm();
        expect(notifications.push).toHaveBeenCalledWith({ title: 'Error', message });
        expect(component.isSubmitting).toBe(false);
    });

    it('can change the total of a negative-price line without introducing negative quantity', () => {
        const { component } = setup();
        const item = component.items[1];
        component.onQtyChange(item);
        item._total = -4;
        component.onTotalChange(item);
        expect(item.quantity).toBe(8);
        expect(item.price).toBe(-0.5);
        item._total = 4;
        component.onTotalChange(item);
        expect(item.quantity).toBe(8);
        expect(item.price).toBe(0.5);
    });
});
