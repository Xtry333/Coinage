import { Injectable } from '@nestjs/common';
import { AccountDao } from '../../daos/account.dao';
import { createMockAccounts } from '../../../test/mock-generators/accounts.mock';

@Injectable()
export class AccountsService {
    public constructor(private readonly accountDao: AccountDao) {}

    public getForUserId(userId: number) {
        console.log(createMockAccounts(3))
        return this.accountDao.getForUserId(userId);
    }
}
