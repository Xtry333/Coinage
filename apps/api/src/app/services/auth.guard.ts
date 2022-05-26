import { CanActivate, createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';
import { UserDao } from '../daos/user.dao';
import { User } from '../entities/User.entity';

export const RequestingUser = createParamDecorator((data: keyof User, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    return data ? user[data] : user;
});

@Injectable()
export class AuthGuard implements CanActivate {
    public static TEST_TOKEN = 'Bearer TOKEN_TEST_123_USER_ID#';
    public constructor(public readonly userDao: UserDao) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const bearerToken = request.headers.authorization as string;
        const id = Number(bearerToken.split('#')[1]);
        // console.log('Token:', bearerToken);
        request.user = await this.userDao.getById(id);

        // If you want to allow the request even if auth fails, always return true
        return bearerToken.includes(AuthGuard.TEST_TOKEN);
    }
}
