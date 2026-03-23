import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { AccountDTO, ConfirmReceiptDTO, ConfirmReceiptItemDTO, NormalizedReceiptItemDTO, ReceiptAiResultDTO } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

export interface ReviewItem extends NormalizedReceiptItemDTO {
    included: boolean;
    /** Tracks which of qty/price was last edited — the other adjusts when total is changed. */
    _lastEdited: 'qty' | 'price';
    /** Computed total displayed in the editable total cell. */
    _total: number;
}

@Component({
    selector: 'app-receipt-ai-review',
    templateUrl: './receipt-ai-review.component.html',
    styleUrls: ['./receipt-ai-review.component.scss'],
    standalone: false,
})
export class ReceiptAiReviewComponent implements OnInit, OnDestroy {
    @Input() public receiptId!: number;
    @Input() public aiData!: ReceiptAiResultDTO;
    @Input() public rawLlmResponse?: string | null;
    @Input() public imageUrl?: string;

    @Output() public transfersCreated = new EventEmitter<void>();

    public accounts: AccountDTO[] = [];
    public selectedAccountId?: number;
    public overrideDate = '';
    public items: ReviewItem[] = [];
    public isSubmitting = false;
    public showRawData = false;
    public showReceiptImage = false;
    public receiptImageSafeUrl?: SafeUrl;
    public imageLoading = false;
    private _receiptImageObjectUrl?: string;

    public constructor(
        private readonly dataService: CoinageDataService,
        private readonly notificationService: NotificationService,
        private readonly http: HttpClient,
        private readonly sanitizer: DomSanitizer,
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
            _lastEdited: 'price' as const,
            _total: +(item.price * item.quantity).toFixed(2),
        }));
    }

    public get includedItems(): ReviewItem[] {
        return this.items.filter((i) => i.included);
    }

    public get totalAmount(): number {
        return +this.includedItems.reduce((sum, i) => sum + i._total, 0).toFixed(2);
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

    public ngOnDestroy(): void {
        if (this._receiptImageObjectUrl) {
            URL.revokeObjectURL(this._receiptImageObjectUrl);
        }
    }

    public toggleReceiptImage(): void {
        this.showReceiptImage = !this.showReceiptImage;
        if (this.showReceiptImage && !this._receiptImageObjectUrl && this.imageUrl) {
            this.imageLoading = true;
            this.http.get(this.imageUrl, { responseType: 'blob' }).subscribe({
                next: (blob) => {
                    this._receiptImageObjectUrl = URL.createObjectURL(blob);
                    this.receiptImageSafeUrl = this.sanitizer.bypassSecurityTrustUrl(this._receiptImageObjectUrl);
                    this.imageLoading = false;
                },
                error: () => {
                    this.imageLoading = false;
                },
            });
        }
    }

    public toggleItem(item: ReviewItem): void {
        item.included = !item.included;
    }

    public toggleAll(included: boolean): void {
        this.items.forEach((i) => (i.included = included));
    }

    // ── Magic Calculator ─────────────────────────────────────────────────────

    public onQtyChange(item: ReviewItem): void {
        item._lastEdited = 'qty';
        item._total = +(item.price * item.quantity).toFixed(2);
    }

    public onPriceChange(item: ReviewItem): void {
        item._lastEdited = 'price';
        item._total = +(item.price * item.quantity).toFixed(2);
    }

    public onTotalChange(item: ReviewItem): void {
        if (item._lastEdited === 'qty' && item.price > 0) {
            item.quantity = +(item._total / item.price).toFixed(3);
        } else if (item.quantity > 0) {
            item.price = +(item._total / item.quantity).toFixed(2);
        }
    }

    public onNameChange(_item: ReviewItem): void {
        // name is bound directly; nothing extra to compute
    }

    // ── Confirm ──────────────────────────────────────────────────────────────

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
