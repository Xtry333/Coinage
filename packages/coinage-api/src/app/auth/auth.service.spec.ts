import { JwtService } from '@nestjs/jwt';

import { UserDao } from '../daos/user.dao';
import { User } from '../entities/User.entity';
import { AuthService } from './auth.service';
import { hashPassword } from './password-hash.util';

describe('AuthService', () => {
    let service: AuthService;
    let getByUsername: jest.Mock;
    let signAsync: jest.Mock;

    const password = 'normal-login-password';
    const passwordHash = hashPassword(password);
    const user = Object.assign(new User(), { id: 42, name: 'developer' });

    beforeEach(() => {
        getByUsername = jest.fn().mockResolvedValue(user);
        signAsync = jest.fn().mockResolvedValue('signed-token');
        service = new AuthService({ signAsync } as unknown as JwtService, { getByUsername } as unknown as UserDao);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('still requires a valid password for normal login', async () => {
        getByUsername.mockResolvedValue({ ...user, password: passwordHash });

        await expect(service.loginUser(user.name, password)).resolves.toBe('signed-token');
        expect(signAsync).toHaveBeenCalledWith({ sub: 42, username: 'developer' });
    });

    it.each(['', 'incorrect'])('rejects an invalid normal login password (%s)', async (invalidPassword) => {
        getByUsername.mockResolvedValue({ ...user, password: passwordHash });

        await expect(service.loginUser(user.name, invalidPassword)).rejects.toThrow('Invalid password.');
        expect(signAsync).not.toHaveBeenCalled();
    });

    it('rejects normal login for a user without a stored password', async () => {
        await expect(service.loginUser(user.name, password)).rejects.toThrow('Invalid password.');
        expect(signAsync).not.toHaveBeenCalled();
    });

    it('rejects normal login for a nonexistent user', async () => {
        getByUsername.mockResolvedValue(undefined);

        await expect(service.loginUser(user.name, password)).rejects.toThrow('Invalid password.');
        expect(signAsync).not.toHaveBeenCalled();
    });
});
