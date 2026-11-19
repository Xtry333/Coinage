import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController forced development login', () => {
    it.each(['signed-token', null])('returns only the session token (%s)', async (token) => {
        const forcedLogin = jest.fn().mockResolvedValue(token);
        const controller = new AuthController({ forcedLogin } as unknown as AuthService);

        await expect(controller.forcedLogin()).resolves.toEqual({ token });
        expect(forcedLogin).toHaveBeenCalledWith();
    });

    it('does not allow caching session responses', () => {
        expect(Reflect.getMetadata('__headers__', AuthController.prototype.forcedLogin)).toContainEqual({
            name: 'Cache-Control',
            value: 'no-store',
        });
    });
});
