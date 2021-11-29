import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export const NavigatorPages = {
    Root: () => '/',
    Dashboard: () => '/dashboard',
    NotFound: () => '/notFound',
    TransfersList: () => '/transfers',
    TransferDetails: (id: number) => `/transfer/details/${id}`,
    TransferEdit: (id: number) => `/transfer/edit/${id}`,
    ReceiptDetails: (id: number) => `/receipt/details/${id}`,
    Summary: (date: string) => `/summary/${date}`,
};

@Injectable({
    providedIn: 'root',
})
export class NavigatorService {
    constructor(private readonly router: Router) {}

    public navigateTo(url: string): void {
        this.router.navigateByUrl(url);
    }

    public goTo(url: string): Promise<boolean> {
        return this.router.navigateByUrl(url);
    }

    public goToNotFoundPage(): Promise<boolean> {
        return this.router.navigateByUrl(NavigatorPages.NotFound());
    }

    public goToTransferDetailsPage(transferId: number): Promise<boolean> {
        return this.router.navigateByUrl(`/transfer/details/${transferId}`);
    }

    public goToReceiptDetailsPage(receiptId: number): Promise<boolean> {
        return this.router.navigateByUrl(`/receipt/details/${receiptId}`);
    }

    public goToDashboardPage(): Promise<boolean> {
        return this.router.navigateByUrl(NavigatorPages.Dashboard());
    }
}
