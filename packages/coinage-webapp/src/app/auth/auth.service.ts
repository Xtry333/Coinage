import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { NotificationService } from '../services/notification.service';
import { AuthDataService } from './auth.dataservice';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    public static readonly BEARER_PREFIX = 'Bearer';
    public static readonly USER_ACCESS_TOKEN = 'user.accessToken';

    public constructor(
        private authDataService: AuthDataService,
        private coinageStorageService: CoinageStorageService,
        private router: Router,
        private notificationService: NotificationService,
    ) {}

    public async login(username: string, password: string): Promise<void> {
        try {
            const response = await this.authDataService.login(username, password);
            this.coinageStorageService.setString(AuthService.USER_ACCESS_TOKEN, response.token);
        } catch (error) {
            console.error('Login failed:', error);
        }
    }

    public async logout(redirectToLogin?: boolean): Promise<void> {
        if (this.isAuthenticated()) {
            try {
                await this.authDataService.logout();
            } catch {
                // Server may be unreachable or token already expired - proceed with local cleanup
            }
            const currentUrl = this.router.url;
            this.coinageStorageService.setString(AuthService.USER_ACCESS_TOKEN, undefined);
            this.notificationService.push({ message: 'You have been logged out.', title: 'Logout' });
            if (redirectToLogin) {
                const returnUrl = currentUrl && currentUrl !== '/login' ? currentUrl : undefined;
                this.router.navigate(['/login'], {
                    queryParams: returnUrl ? { returnUrl } : {},
                });
            }
        }
    }

    public isAuthenticated(): boolean {
        return !!this.coinageStorageService.getString(AuthService.USER_ACCESS_TOKEN);
    }

    public getAccessToken(): string {
        return `${AuthService.BEARER_PREFIX} ${this.coinageStorageService.getString(AuthService.USER_ACCESS_TOKEN)}`;
    }
}
