import { Controller, Get, Param } from '@nestjs/common';
import { UserDao } from '../../daos/user.dao';

@Controller('user')
export class UserController {
    public constructor(private readonly userDao: UserDao) {}

    @Get('data/:id')
    public async getUserData(@Param('id') userId: number): Promise<any> {
        const user = await this.userDao.getById(userId);
        return {
            userId: userId,
            username: user.name,
        };
    }

    @Get('date')
    public async getServerDate(): Promise<Date> {
        const date = await this.userDao.getCurrentDbDate();
        return date;
    }
}
