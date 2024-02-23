import { Injectable } from '@angular/core';

import { AuthDataService } from './auth.dataservice';
import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    public static readonly USER_ACCESS_TOKEN = 'user.accessToken';

    public constructor(private authDataService: AuthDataService, private coinageStorageService: CoinageStorageService) {
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

    public logout(): void {
        this.coinageStorageService.setString(AuthService.USER_ACCESS_TOKEN, undefined);
    }

    public isAuthenticated(): boolean {
        // Check if the token exists in CoinageStorageService
        return !!this.coinageStorageService.getString(AuthService.USER_ACCESS_TOKEN);
    }
}
