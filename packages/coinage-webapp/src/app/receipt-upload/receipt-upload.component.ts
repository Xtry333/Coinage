import { Component } from '@angular/core';

import { NavigatorService } from '../app-routing/navigator.service';
import { CoinageDataService } from '../services/coinage.data-service';

@Component({
    selector: 'app-receipt-upload',
    templateUrl: './receipt-upload.component.html',
    styleUrls: ['./receipt-upload.component.scss'],
    standalone: false,
})
export class ReceiptUploadPageComponent {
    public state: 'idle' | 'creating' | 'uploading' | 'error' = 'idle';
    public errorMessage = '';

    public constructor(
        private readonly coinageData: CoinageDataService,
        private readonly navigator: NavigatorService,
    ) {}

    public async onFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.state = 'creating';
        this.errorMessage = '';

        try {
            const { id } = await this.coinageData.createReceipt();

            this.state = 'uploading';
            await this.coinageData.uploadReceiptImage(id, file);

            await this.navigator.goToReceiptDetailsPage(id);
        } catch {
            this.state = 'error';
            this.errorMessage = 'Something went wrong. Please try again.';
            input.value = '';
        }
    }
}
