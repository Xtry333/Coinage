import { Injectable } from '@nestjs/common';
import { AccountDao } from '../../daos/account.dao';

@Injectable()
export class AccountsService {
    public constructor(private readonly accountDao: AccountDao) {}

    public getForUserId(userId: number) {
        return this.accountDao.getForUserId(userId);
    }
}
