import { Controller, Get } from '@nestjs/common';

import { AccountDTO } from '@coinage-app/interfaces';
import { AccountDao } from '../daos/account.dao';

@Controller('account')
export class AccountsController {
    constructor(private readonly accountDao: AccountDao) {}

    @Get('all')
    async getAllTransactions(): Promise<AccountDTO[]> {
        const currentUserId = 1;
        return await this.accountDao.getForAccount(currentUserId);
    }
}
