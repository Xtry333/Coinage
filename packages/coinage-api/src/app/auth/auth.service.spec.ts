import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { environment } from '../../environments/environment';
import { UserDao } from '../daos/user.dao';
import { User } from '../entities/User.entity';
import { AuthService } from './auth.service';
import { hashPassword } from './password-hash.util';

describe('AuthService forced development login', () => {
    let service: AuthService;
    let settings: Record<string, string | undefined>;
    let getByUsername: jest.Mock;
    let signAsync: jest.Mock;

    const password = 'development-password';
    const user = Object.assign(new User(), { id: 42, name: 'developer', password: hashPassword(password) });

    beforeEach(() => {
        settings = {
            COINAGE_FORCED_LOGIN: user.name,
            COINAGE_FORCED_PASSWORD: password,
        };
        getByUsername = jest.fn().mockResolvedValue(user);
        signAsync = jest.fn().mockResolvedValue('signed-token');
        const config = { get: (name: string) => settings[name] } as unknown as ConfigService;
        service = new AuthService({ signAsync } as unknown as JwtService, { getByUsername } as unknown as UserDao, config);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('validates the configured existing user and issues the normal JWT', async () => {
        await expect(service.forcedLogin()).resolves.toBe('signed-token');

        expect(getByUsername).toHaveBeenCalledWith('developer');
        expect(signAsync).toHaveBeenCalledWith({ sub: 42, username: 'developer' });
    });

    it.each([{ COINAGE_FORCED_LOGIN: undefined }, { COINAGE_FORCED_LOGIN: '' }, { COINAGE_FORCED_PASSWORD: undefined }, { COINAGE_FORCED_PASSWORD: '' }])(
        'does not log in with incomplete configuration: %s',
        async (overrides) => {
            Object.assign(settings, overrides);

            await expect(service.forcedLogin()).resolves.toBeNull();
            expect(getByUsername).not.toHaveBeenCalled();
            expect(signAsync).not.toHaveBeenCalled();
        },
    );

    it('never permits forced login in a production build, even with development runtime settings', async () => {
        jest.replaceProperty(environment, 'production', true);
        settings.NODE_ENV = 'development';

        await expect(service.forcedLogin()).resolves.toBeNull();
        expect(getByUsername).not.toHaveBeenCalled();
        expect(signAsync).not.toHaveBeenCalled();
    });

    it('also disables forced login when running a development build with NODE_ENV=production', async () => {
        settings.NODE_ENV = 'production';

        await expect(service.forcedLogin()).resolves.toBeNull();
        expect(getByUsername).not.toHaveBeenCalled();
    });

    it('rejects an invalid password without issuing a token', async () => {
        settings.COINAGE_FORCED_PASSWORD = 'incorrect';

        await expect(service.forcedLogin()).rejects.toThrow(UnauthorizedException);
        expect(signAsync).not.toHaveBeenCalled();
    });

    it('rejects a nonexistent user without issuing a token', async () => {
        getByUsername.mockResolvedValue(undefined);

        await expect(service.forcedLogin()).rejects.toThrow('Forced development login failed.');
        expect(signAsync).not.toHaveBeenCalled();
    });
});
