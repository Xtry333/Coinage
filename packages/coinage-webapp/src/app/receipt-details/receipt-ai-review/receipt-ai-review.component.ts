import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { AccountDTO, ConfirmReceiptDTO, ConfirmReceiptItemDTO, NormalizedReceiptItemDTO, ReceiptAiResultDTO } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

export interface ReviewItem extends NormalizedReceiptItemDTO {
    included: boolean;
}

@Component({
    selector: 'app-receipt-ai-review',
    templateUrl: './receipt-ai-review.component.html',
    styleUrls: ['./receipt-ai-review.component.scss'],
    standalone: false,
})
export class ReceiptAiReviewComponent implements OnInit {
    @Input() public receiptId!: number;
    @Input() public aiData!: ReceiptAiResultDTO;

    @Output() public transfersCreated = new EventEmitter<void>();

    public accounts: AccountDTO[] = [];
    public selectedAccountId?: number;
    public overrideDate = '';
    public items: ReviewItem[] = [];
    public isSubmitting = false;
    public showRawJson = false;

    public constructor(
        private readonly dataService: CoinageDataService,
        private readonly notificationService: NotificationService,
    ) {}

    public ngOnInit(): void {
        this.dataService.getAllAvailableAccounts().subscribe((accounts) => {
            this.accounts = accounts;
        });

        const normalized = this.aiData.normalized;
        this.overrideDate = normalized.date ?? '';
        this.items = normalized.items.map((item) => ({
            ...item,
            included: true,
        }));
    }

    public get includedItems(): ReviewItem[] {
        return this.items.filter((i) => i.included);
    }

    public get totalAmount(): number {
        return this.includedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    }

    public get matchedCount(): number {
        return this.items.filter((i) => !i.isNew).length;
    }

    public get newCount(): number {
        return this.items.filter((i) => i.isNew).length;
    }

    public get confidence(): number {
        return this.aiData.raw.confidence ?? 0;
    }

    public get confidencePercent(): string {
        return (this.confidence * 100).toFixed(0);
    }

    public get confidenceClass(): string {
        if (this.confidence >= 0.8) return 'text-green-700 bg-green-100';
        if (this.confidence >= 0.5) return 'text-yellow-700 bg-yellow-100';
        return 'text-red-700 bg-red-100';
    }

    public toggleItem(item: ReviewItem): void {
        item.included = !item.included;
    }

    public toggleAll(included: boolean): void {
        this.items.forEach((i) => (i.included = included));
    }

    public async onConfirm(): Promise<void> {
        if (!this.selectedAccountId) {
            this.notificationService.push({ title: 'Error', message: 'Please select an account' });
            return;
        }

        if (this.includedItems.length === 0) {
            this.notificationService.push({ title: 'Error', message: 'No items selected' });
            return;
        }

        this.isSubmitting = true;

        const dto: ConfirmReceiptDTO = {
            accountId: this.selectedAccountId,
            date: this.overrideDate,
            contractorId: this.aiData.normalized.contractorId,
            items: this.items.map(
                (item): ConfirmReceiptItemDTO => ({
                    itemId: item.itemId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    isNew: item.isNew,
                    included: item.included,
                }),
            ),
        };

        try {
            await this.dataService.confirmReceipt(this.receiptId, dto);
            this.notificationService.push({
                title: 'Transfers Created',
                message: `${this.includedItems.length} item(s) confirmed for receipt #${this.receiptId}`,
            });
            this.transfersCreated.emit();
        } catch {
            this.notificationService.push({ title: 'Error', message: 'Failed to create transfers' });
        } finally {
            this.isSubmitting = false;
        }
    }
}
