import { HttpTestingController } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { NotificationService } from '../services/notification.service';
import { authGuard, loginGuard } from './auth.guard';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

describe('Forced development login bootstrap', () => {
    let service: AuthService;
    let http: HttpTestingController;
    let storage: CoinageStorageService;
    let router: Router;

    beforeEach(() => {
        storage = new CoinageStorageService();
        storage.setString(AuthService.USER_ACCESS_TOKEN, undefined);
        // Keep the real auth providers/initializer without unrelated UI modules.
        TestBed.overrideModule(AuthModule, { set: { imports: [], declarations: [] } });
        TestBed.configureTestingModule({
            imports: [AuthModule],
            providers: [
                { provide: CoinageStorageService, useValue: storage },
                { provide: NotificationService, useValue: { push: jest.fn() } },
            ],
        });
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    function initialize() {
        // TestBed runs application initializers when its injector is first used.
        service = TestBed.inject(AuthService);
        http = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);
        return TestBed.inject(ApplicationInitStatus);
    }

    afterEach(() => {
        http.verify();
        storage.setString(AuthService.USER_ACCESS_TOKEN, undefined);
        jest.restoreAllMocks();
    });

    function protectedRoute(url = '/account/42') {
        return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));
    }

    function loginRoute() {
        return TestBed.runInInjectionContext(() => loginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    }

    it('waits for the forced session during app initialization, then allows the requested protected page', async () => {
        const status = initialize();

        expect(status.done).toBe(false);
        expect(service.isAuthenticated()).toBe(false);

        const request = http.expectOne('/api/auth/forced-login');
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({});
        expect(request.request.headers.has('authorization')).toBe(false);
        request.flush({ token: 'forced-user-token' });
        await status.donePromise;

        expect(status.done).toBe(true);
        expect(service.getAccessToken()).toBe('Bearer forced-user-token');
        expect(protectedRoute()).toBe(true);
        expect(router.serializeUrl(loginRoute() as ReturnType<Router['createUrlTree']>)).toBe('/dashboard');
    });

    it('replaces a saved session with the configured user, without sending the old token', async () => {
        storage.setString(AuthService.USER_ACCESS_TOKEN, 'previous-user-token');

        const status = initialize();
        const request = http.expectOne('/api/auth/forced-login');
        expect(request.request.headers.has('authorization')).toBe(false);
        request.flush({ token: 'forced-user-token' });
        await status.donePromise;

        expect(service.getAccessToken()).toBe('Bearer forced-user-token');
    });

    it('keeps the normal login screen when forced login is not configured', async () => {
        const status = initialize();
        http.expectOne('/api/auth/forced-login').flush({ token: null });
        await status.donePromise;

        expect(service.isAuthenticated()).toBe(false);
        expect(loginRoute()).toBe(true);
        expect(router.serializeUrl(protectedRoute() as ReturnType<Router['createUrlTree']>)).toBe('/login?returnUrl=%2Faccount%2F42');
    });

    it('leaves an existing session intact when forced login is disabled', async () => {
        storage.setString(AuthService.USER_ACCESS_TOKEN, 'existing-token');

        const status = initialize();
        http.expectOne('/api/auth/forced-login').flush({ token: null });
        await status.donePromise;

        expect(service.getAccessToken()).toBe('Bearer existing-token');
    });

    it.each([401, 500, 503])('does not block startup on forced login failure (%s)', async (statusCode) => {
        const status = initialize();
        http.expectOne('/api/auth/forced-login').flush({}, { status: statusCode, statusText: 'Unavailable' });
        await expect(status.donePromise).resolves.toBeUndefined();

        expect(service.isAuthenticated()).toBe(false);
        expect(loginRoute()).toBe(true);
        expect(console.warn).toHaveBeenCalledWith('Forced development login unavailable; using the normal login flow.');
    });

    it('does not wait indefinitely for an unresponsive API', async () => {
        jest.useFakeTimers();
        try {
            const status = initialize();
            const request = http.expectOne('/api/auth/forced-login');

            await jest.advanceTimersByTimeAsync(5000);
            await status.donePromise;

            expect(request.cancelled).toBe(true);
            expect(status.done).toBe(true);
            expect(service.isAuthenticated()).toBe(false);
        } finally {
            jest.useRealTimers();
        }
    });

    it('does not request forced login from a production-mode webapp', async () => {
        jest.replaceProperty(globalThis as unknown as { ngDevMode: boolean }, 'ngDevMode', false);

        const status = initialize();
        await status.donePromise;

        http.expectNone('/api/auth/forced-login');
        expect(service.isAuthenticated()).toBe(false);
    });
});
