import { Controller, Header, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { environment } from '../../environments/environment';
import { UserDao } from '../daos/user.dao';

// This controller is only imported through the development build's registration.
@Controller('auth')
export class DevelopmentAuthController {
    public constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userDao: UserDao,
    ) {}

    @Post('forced-login')
    @Header('Cache-Control', 'no-store')
    public async forcedLogin(): Promise<{ token: string | null }> {
        if (environment.production || this.configService.get<string>('NODE_ENV') === 'production') {
            throw new NotFoundException();
        }

        const username = this.configService.get<string>('COINAGE_FORCED_LOGIN');
        if (!username) {
            return { token: null };
        }

        const user = await this.userDao.getByUsername(username);
        if (user === undefined) {
            throw new UnauthorizedException('Forced development login failed.');
        }

        const token = await this.jwtService.signAsync({ sub: user.id, username: user.name });
        return { token };
    }
}
