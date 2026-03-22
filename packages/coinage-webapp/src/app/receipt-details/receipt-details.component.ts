import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReceiptDetailsDTO, ReceiptProcessingStatus, ReceiptUploadResponseDTO, TransferType } from '@app/interfaces';
import { Subscription } from 'rxjs';

import { ActivatedRoute } from '@angular/router';
import { CoinageDataService } from '../services/coinage.data-service';
import { NavigatorService } from '../app-routing/navigator.service';
import { SocketService } from '../services/socket.service';

@Component({
    selector: 'app-receipt-details',
    templateUrl: './receipt-details.component.html',
    styleUrls: ['./receipt-details.component.scss'],
    standalone: false,
})
export class ReceiptDetailsComponent implements OnInit, OnDestroy {
    public receiptDetails?: ReceiptDetailsDTO;
    public receiptId?: number;

    public uploadStatus: 'idle' | 'uploading' | 'duplicate' | 'queued' | 'processing' | 'processed' | 'error' = 'idle';
    public uploadMessage = '';
    public duplicateReceiptId?: number;
    public aiExtractedData?: unknown;
    public processingStatus?: ReceiptProcessingStatus;

    private socketSubs: Subscription[] = [];

    public readonly ReceiptProcessingStatus = ReceiptProcessingStatus;

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly navigator: NavigatorService,
        private readonly coinageData: CoinageDataService,
        private readonly socketService: SocketService,
    ) {}

    public ngOnInit(): void {
        this.route.paramMap.subscribe((params) => {
            const id = parseInt(params.get('id') ?? '') ?? undefined;
            if (id) {
                this.receiptId = id;
                this.coinageData.getReceiptDetails(id).then((receipt) => {
                    this.receiptDetails = receipt;
                });
                this.loadStatus(id);
                this.subscribeToSocketEvents(id);
            } else {
                this.navigator.goToNotFoundPage();
            }
        });
    }

    public ngOnDestroy(): void {
        this.socketSubs.forEach((s) => s.unsubscribe());
    }

    private subscribeToSocketEvents(id: number): void {
        const queued = this.socketService.fromEvent<{ receiptId: number }>('receiptQueued').subscribe((data) => {
            if (data.receiptId === id) this.uploadStatus = 'queued';
        });
        const processing = this.socketService.fromEvent<{ receiptId: number }>('receiptProcessing').subscribe((data) => {
            if (data.receiptId === id) this.uploadStatus = 'processing';
        });
        const processed = this.socketService.fromEvent<{ receiptId: number; aiData: object }>('receiptProcessed').subscribe((data) => {
            if (data.receiptId === id) {
                this.uploadStatus = 'processed';
                this.aiExtractedData = data.aiData;
            }
        });
        const error = this.socketService.fromEvent<{ receiptId: number; error: string }>('receiptError').subscribe((data) => {
            if (data.receiptId === id) {
                this.uploadStatus = 'error';
                this.uploadMessage = data.error;
            }
        });
        this.socketSubs.push(queued, processing, processed, error);
    }

    private async loadStatus(id: number): Promise<void> {
        try {
            const result = await this.coinageData.getReceiptStatus(id);
            this.processingStatus = result.status;
            this.aiExtractedData = result.aiData;
            if (result.status === ReceiptProcessingStatus.PENDING) this.uploadStatus = 'queued';
            else if (result.status === ReceiptProcessingStatus.PROCESSING) this.uploadStatus = 'processing';
            else if (result.status === ReceiptProcessingStatus.EXTRACTED) this.uploadStatus = 'processing';
            else if (result.status === ReceiptProcessingStatus.PROCESSED) this.uploadStatus = 'processed';
            else if (result.status === ReceiptProcessingStatus.ERROR) this.uploadStatus = 'error';
        } catch {
            // non-critical
        }
    }

    public async onFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file || !this.receiptId) return;

        this.uploadStatus = 'uploading';
        this.uploadMessage = '';

        try {
            const response: ReceiptUploadResponseDTO = await this.coinageData.uploadReceiptImage(this.receiptId, file);
            if (response.isDuplicate) {
                this.uploadStatus = 'duplicate';
                this.duplicateReceiptId = response.duplicateOfReceiptId;
                this.uploadMessage = `This image appears to be a duplicate of receipt #${response.duplicateOfReceiptId}.`;
            } else {
                this.uploadStatus = 'queued';
                this.uploadMessage = 'Image uploaded and queued for AI processing.';
            }
        } catch {
            this.uploadStatus = 'error';
            this.uploadMessage = 'Upload failed. Please try again.';
        }

        input.value = '';
    }

    public get receiptDirectionDisplaySymbol(): string {
        return TransferType.OUTCOME.symbol;
    }

    public get remainingAmount(): number {
        if (this.receiptDetails === undefined) {
            return 0;
        }
        return Math.abs(this.receiptDetails.totalTransferred - (this.receiptDetails.amount ?? 0));
    }

    public get statusLabel(): string {
        switch (this.uploadStatus) {
            case 'uploading': return 'Uploading...';
            case 'duplicate': return 'Duplicate image';
            case 'queued': return 'Queued for AI';
            case 'processing': return 'AI processing...';
            case 'processed': return 'AI processed';
            case 'error': return 'Error';
            default: return '';
        }
    }

    public get statusClass(): string {
        switch (this.uploadStatus) {
            case 'uploading': return 'bg-blue-100 text-blue-700';
            case 'duplicate': return 'bg-yellow-100 text-yellow-700';
            case 'queued': return 'bg-indigo-100 text-indigo-700';
            case 'processing': return 'bg-purple-100 text-purple-700';
            case 'processed': return 'bg-green-100 text-green-700';
            case 'error': return 'bg-red-100 text-red-700';
            default: return '';
        }
    }
}
