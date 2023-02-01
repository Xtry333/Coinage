import { Controller, Get, Param } from '@nestjs/common';

import { AccountDao } from '../daos/account.dao';
import { BalanceDTO } from '@coinage-app/interfaces';
import { AccountBalanceService } from '../services/account-balance.service';
import { UserDao } from '../daos/user.dao';

@Controller('dashboard')
export class DashboardComponent {
    public constructor(private readonly accountDao: AccountDao, private readonly accountBalanceService: AccountBalanceService) {}

    @Get('/balance/:date')
    public async getBalance(@Param('date') date: Date): Promise<BalanceDTO[]> {
        const accounts = await this.accountDao.getForUserId(1);
        //date = new Date(2021, 0, 0);
        const accountIds = accounts.map((a) => a.id); //[1, 5, 6, 4, 9, 8];
        //const balance = await this.accountDao.getAccountBalanceForAccountAsOfDate(accountIds, date);
        //const balance = await this.accountBalanceService.getAccountsBalanceByIds(accountIds, date);
        return await this.accountBalanceService.getAccountsBalanceByIds(accountIds, date);
    }
}
