import { Controller, Get, Param } from '@nestjs/common';

import { AccountDao } from '../daos/account.dao';
import { BalanceDTO } from '@coinage-app/interfaces';

@Controller('dashboard')
export class DashboardComponent {
    public constructor(private readonly accountDao: AccountDao) {}

    @Get('/balance/:date')
    public async getBalance(@Param('date') date: Date): Promise<BalanceDTO[]> {
        const accountIds = [1, 5, 6];
        const balance = await this.accountDao.getAccountBalanceForAccountAsOfDate(accountIds, date);
        return balance;
    }
}
