import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    it('validates the supplied credentials through normal login', async () => {
        const loginUser = jest.fn().mockResolvedValue('signed-token');
        const controller = new AuthController({ loginUser } as unknown as AuthService);

        await expect(controller.login({ username: 'developer', password: 'password' })).resolves.toEqual({ token: 'signed-token' });
        expect(loginUser).toHaveBeenCalledWith('developer', 'password');
    });

    it('acknowledges logout', async () => {
        const controller = new AuthController({} as AuthService);

        await expect(controller.logout()).resolves.toEqual({ message: 'Logged out successfully.' });
    });
});
