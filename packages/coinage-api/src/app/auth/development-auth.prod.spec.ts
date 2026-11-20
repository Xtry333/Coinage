import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { developmentAuthControllers } from './development-auth.prod';
import { AuthGuard } from '../services/auth.guard';

describe('Production auth registration', () => {
    let app: INestApplication;
    let url: string;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            controllers: [AuthController, ...developmentAuthControllers],
            providers: [{ provide: AuthService, useValue: { loginUser: jest.fn().mockResolvedValue('normal-token') } }],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();
        app = module.createNestApplication();
        app.setGlobalPrefix('api');
        await app.listen(0, '127.0.0.1');
        url = await app.getUrl();
    });

    afterAll(async () => {
        await app?.close();
    });

    it('does not register any development controllers', () => {
        expect(developmentAuthControllers).toEqual([]);
    });

    it.each(['GET', 'POST'])('returns 404 for %s /api/auth/forced-login', async (method) => {
        const response = await fetch(`${url}/api/auth/forced-login`, { method });

        expect(response.status).toBe(404);
    });

    it('still exposes normal password-based login', async () => {
        const response = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'developer', password: 'password' }),
        });

        expect(response.status).toBe(201);
        await expect(response.json()).resolves.toEqual({ token: 'normal-token' });
    });
});
