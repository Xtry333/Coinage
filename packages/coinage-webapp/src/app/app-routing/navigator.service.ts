import { Injectable } from '@angular/core';
import { PartialDate } from '@app/interfaces';
import { Router } from '@angular/router';
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

    public goToDashboardPage(): Promise<boolean> {
        return this.router.navigateByUrl(CoinageRoutes.DashboardPage.getUrl({}));
    }

    public goToSummaryPage(date: Date): Promise<boolean> {
        return this.router.navigateByUrl(CoinageRoutes.SummaryPage.getUrl({ month: String(PartialDate.fromDate(date)) }));
    }
}
