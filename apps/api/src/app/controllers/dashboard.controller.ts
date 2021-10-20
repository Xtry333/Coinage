import { BalanceDTO } from '@coinage-app/interfaces';
import { Controller, Get } from '@nestjs/common';

import { AccountDao } from '../daos/account.dao';

@Controller('dashboard')
export class DashboardComponent {
    constructor(private readonly accountDao: AccountDao) {}

    @Get('/balance')
    async getBalance(): Promise<BalanceDTO[]> {
        const accountIds = [1, 5];
        const balance = await this.accountDao.getAccountBalance(accountIds);
        return balance;
    }
}
