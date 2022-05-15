import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
    public static TEST_TOKEN = 'Bearer TOKEN_TEST_!@#_123';
    public constructor() {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const bearerToken = request.headers.authorization;
        // console.log('Token:', bearerToken);
        request.principal = bearerToken;

        // If you want to allow the request even if auth fails, always return true
        return AuthGuard.TEST_TOKEN === bearerToken;
    }
}
