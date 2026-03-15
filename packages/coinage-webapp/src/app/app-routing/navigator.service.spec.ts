import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { NavigatorService } from './navigator.service';

describe('NavigatorService', () => {
    let service: NavigatorService;
    let router: jest.Mocked<Partial<Router>>;

    beforeEach(() => {
        router = {
            navigateByUrl: jest.fn().mockResolvedValue(true),
        };

        TestBed.configureTestingModule({
            providers: [
                NavigatorService,
                { provide: Router, useValue: router },
            ],
        });
        service = TestBed.inject(NavigatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('.navigateTo', () => {
        it('should call router.navigateByUrl with the provided URL', () => {
            service.navigateTo('/some/path');
            expect(router.navigateByUrl).toHaveBeenCalledWith('/some/path');
        });
    });

    describe('.goTo', () => {
        it('should call router.navigateByUrl with skipLocationChange=false by default', async () => {
            await service.goTo('/some/path');
            expect(router.navigateByUrl).toHaveBeenCalledWith('/some/path', { skipLocationChange: false });
        });

        it('should pass skipLocationChange=true when specified', async () => {
            await service.goTo('/some/path', true);
            expect(router.navigateByUrl).toHaveBeenCalledWith('/some/path', { skipLocationChange: true });
        });
    });

    describe('.goToTransferDetailsPage', () => {
        it('should navigate to transfer details URL containing the given ID', async () => {
            await service.goToTransferDetailsPage(42);

            const calledUrl = (router.navigateByUrl as jest.Mock).mock.calls[0][0] as string;
            expect(calledUrl).toContain('42');
            expect(calledUrl).toContain('transfer');
        });
    });

    describe('.goToReceiptDetailsPage', () => {
        it('should navigate to receipt details URL containing the given ID', async () => {
            await service.goToReceiptDetailsPage(7);

            const calledUrl = (router.navigateByUrl as jest.Mock).mock.calls[0][0] as string;
            expect(calledUrl).toContain('7');
            expect(calledUrl).toContain('receipt');
        });
    });

    describe('.goToDashboardPage', () => {
        it('should navigate to dashboard URL', async () => {
            await service.goToDashboardPage();

            const calledUrl = (router.navigateByUrl as jest.Mock).mock.calls[0][0] as string;
            expect(calledUrl).toContain('dashboard');
        });
    });

    describe('.goToNotFoundPage', () => {
        it('should call router.navigateByUrl', async () => {
            await service.goToNotFoundPage();
            expect(router.navigateByUrl).toHaveBeenCalled();
        });
    });
});
