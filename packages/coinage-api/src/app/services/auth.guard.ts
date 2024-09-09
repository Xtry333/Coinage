import { Http2ServerRequest } from 'http2';

import { CanActivate, createParamDecorator, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { UserDao } from '../daos/user.dao';
import { User } from '../entities/User.entity';

export const RequestingUser = createParamDecorator((data: keyof User, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    return data ? user[data] : user;
});

@Injectable()
export class AuthGuard implements CanActivate {
    public constructor(public readonly userDao: UserDao, private readonly authService: AuthService) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request: Http2ServerRequest & { [key: string]: unknown } = context.switchToHttp().getRequest();
            const bearerToken = request.headers.authorization;

            if (!bearerToken) {
                throw new UnauthorizedException();
            }

            const [, accessToken] = bearerToken.split(' ');

            const user = await this.authService.validateUser(accessToken);

            if (user) {
                request.user = user;
                return true;
            }
        } catch (error) {
            throw new UnauthorizedException();
        }
        throw new UnauthorizedException();
    }
}
