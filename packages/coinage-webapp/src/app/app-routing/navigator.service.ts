import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PartialDate } from '@app/interfaces';
import { CoinageRoutes } from './app-routes';

@Injectable({
    providedIn: 'root',
})
export class NavigatorService {
    public constructor(private readonly router: Router) {}

    public navigateTo(url: string): void {
        this.router.navigateByUrl(url);
    }

    public goTo(url: string, skipLocationChange = false): Promise<boolean> {
        return this.router.navigateByUrl(url, { skipLocationChange });
    }

    public goToNotFoundPage(): Promise<boolean> {
        return this.router.navigateByUrl(CoinageRoutes.NotFoundPage.getUrl({}));
    }

    public goToTransferDetailsPage(transferId: number): Promise<boolean> {
        return this.router.navigateByUrl(CoinageRoutes.TransferDetailsPage.getUrl({ id: transferId }));
    }

    public goToReceiptDetailsPage(receiptId: number): Promise<boolean> {
        return this.router.navigateByUrl(CoinageRoutes.ReceiptDetailsPage.getUrl({ id: receiptId }));
    }

    public goToReceiptUploadPage(): Promise<boolean> {
        return this.router.navigateByUrl(CoinageRoutes.ReceiptUploadPage.getUrl({}));
    }

    public goToDashboardPage(): Promise<boolean> {
        return this.router.navigateByUrl(CoinageRoutes.DashboardPage.getUrl({}));
    }

    public goToSummaryPage(date: Date): Promise<boolean> {
        return this.router.navigateByUrl(CoinageRoutes.SummaryPage.getUrl({ month: String(PartialDate.fromDate(date)) }));
    }
}
