import { Controller, Post, Body } from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    public constructor(private readonly authService: AuthService) {}

    @Post('login')
    public async login(@Body() credentials: { username: string; password: string }) {
        const token = await this.authService.loginUser(credentials.username, credentials.password);
        return { token };
    }
}
