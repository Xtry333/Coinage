import { Controller, Get, Param } from '@nestjs/common';

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

    @Get('balance/:accountId/:asOfDate')
    async getAccountBalanceAsOfDate(@Param() params: { [key: string]: string }): Promise<number> {
        const accountId = parseInt(params.accountId);
        const asOfDate = new Date(params.asOfDate);
        return (await this.accountDao.getAccountBalanceForAccountAsOfDate([accountId], asOfDate))[0].balance;
    }
}
