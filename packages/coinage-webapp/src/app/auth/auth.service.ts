import { Injectable } from '@angular/core';

import { NavigatorService } from '../app-routing/navigator.service';
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
        private navigatorService: NavigatorService,
        private notificationService: NotificationService,
    ) {
        console.log(this);
    }

    public async login(username: string, password: string): Promise<void> {
        console.log('Login:', username, password);
        try {
            // Call the data service to fetch the JWT token
            const response = await this.authDataService.login(username, password);
            console.log('Login response:', response);

            // Store the token using CoinageStorageService
            this.coinageStorageService.setString(AuthService.USER_ACCESS_TOKEN, response.token);

            // Perform any additional login logic here
            // ...
        } catch (error) {
            // Handle any errors that occurred during login
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
            this.coinageStorageService.setString(AuthService.USER_ACCESS_TOKEN, undefined);
            this.notificationService.push({ message: 'You have been logged out.', title: 'Logout' });
            if (redirectToLogin) {
                this.navigatorService.navigateTo('login');
            }
        }
    }

    public isAuthenticated(): boolean {
        // Check if the token exists in CoinageStorageService
        return !!this.coinageStorageService.getString(AuthService.USER_ACCESS_TOKEN);
    }

    public getAccessToken(): string {
        return `${AuthService.BEARER_PREFIX} ${this.coinageStorageService.getString(AuthService.USER_ACCESS_TOKEN)}`;
    }
}
