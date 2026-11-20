import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { DevelopmentAuthController } from './development-auth.controller';
import { environment } from '../../environments/environment';
import { UserDao } from '../daos/user.dao';
import { User } from '../entities/User.entity';

describe('DevelopmentAuthController', () => {
    let controller: DevelopmentAuthController;
    let settings: Record<string, string | undefined>;
    let getByUsername: jest.Mock;
    let signAsync: jest.Mock;

    const user = Object.assign(new User(), { id: 42, name: 'developer' });

    beforeEach(() => {
        settings = { COINAGE_FORCED_LOGIN: user.name };
        getByUsername = jest.fn().mockResolvedValue(user);
        signAsync = jest.fn().mockResolvedValue('signed-token');
        controller = new DevelopmentAuthController(
            { get: (name: string) => settings[name] } as unknown as ConfigService,
            { signAsync } as unknown as JwtService,
            { getByUsername } as unknown as UserDao,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('issues the normal JWT using only the configured username, even without a stored password', async () => {
        await expect(controller.forcedLogin()).resolves.toEqual({ token: 'signed-token' });

        expect(user.password).toBeUndefined();
        expect(getByUsername).toHaveBeenCalledWith('developer');
        expect(signAsync).toHaveBeenCalledWith({ sub: 42, username: 'developer' });
    });

    it.each([undefined, ''])('does not force login when the configured username is %s', async (username) => {
        settings.COINAGE_FORCED_LOGIN = username;

        await expect(controller.forcedLogin()).resolves.toEqual({ token: null });
        expect(getByUsername).not.toHaveBeenCalled();
        expect(signAsync).not.toHaveBeenCalled();
    });

    it('also rejects production mode if the development controller is accidentally loaded', async () => {
        jest.replaceProperty(environment, 'production', true);
        settings.NODE_ENV = 'development';

        await expect(controller.forcedLogin()).rejects.toThrow(NotFoundException);
        expect(getByUsername).not.toHaveBeenCalled();
        expect(signAsync).not.toHaveBeenCalled();
    });

    it('rejects a development build running with NODE_ENV=production', async () => {
        settings.NODE_ENV = 'production';

        await expect(controller.forcedLogin()).rejects.toThrow(NotFoundException);
        expect(getByUsername).not.toHaveBeenCalled();
    });

    it('rejects a nonexistent user without issuing a token', async () => {
        getByUsername.mockResolvedValue(undefined);

        await expect(controller.forcedLogin()).rejects.toThrow(UnauthorizedException);
        expect(signAsync).not.toHaveBeenCalled();
    });

    it('does not allow caching session responses', () => {
        expect(Reflect.getMetadata('__headers__', DevelopmentAuthController.prototype.forcedLogin)).toContainEqual({
            name: 'Cache-Control',
            value: 'no-store',
        });
    });
});
