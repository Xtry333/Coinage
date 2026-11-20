import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, isDevMode, provideAppInitializer } from '@angular/core';
import { lastValueFrom, timeout } from 'rxjs';

import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { AuthService } from './auth.service';

// Replaced with an empty provider list at build time in production.
export const developmentAuthProviders = [
    provideAppInitializer(async () => {
        if (!isDevMode()) {
            return;
        }

        // Bootstrap must not send an old session or trigger interceptor logout redirects.
        const http = new HttpClient(inject(HttpBackend));
        const storage = inject(CoinageStorageService);
        try {
            const response = await lastValueFrom(http.post<{ token: string | null }>('/api/auth/forced-login', {}).pipe(timeout(5000)));
            if (response.token) {
                storage.setString(AuthService.USER_ACCESS_TOKEN, response.token);
            }
        } catch {
            console.warn('Forced development login unavailable; using the normal login flow.');
        }
    }),
];
