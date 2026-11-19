import { Body, Controller, Header, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../services/auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    public constructor(private readonly authService: AuthService) {}

    @Post('login')
    public async login(@Body() credentials: { username: string; password: string }) {
        const token = await this.authService.loginUser(credentials.username, credentials.password);
        return { token };
    }

    @Post('forced-login')
    @Header('Cache-Control', 'no-store')
    public async forcedLogin() {
        const token = await this.authService.forcedLogin();
        return { token };
    }

    @UseGuards(AuthGuard)
    @Post('logout')
    public async logout() {
        // In the future, this endpoint can invalidate the JWT token
        // (e.g., add it to a blacklist or revoke a refresh token).
        // For now, it confirms the logout on the server side.
        return { message: 'Logged out successfully.' };
    }
}
