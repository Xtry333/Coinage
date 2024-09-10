import { HttpService } from '@nestjs/axios';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { BalanceDTO } from '@coinage-app/interfaces';

import { AccountDao } from '../daos/account.dao';
import { User } from '../entities/User.entity';
import { AccountBalanceService } from '../services/account-balance.service';
import { AuthGuard, RequestingUser } from '../services/auth.guard';

@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardComponent {
    public constructor(
        private readonly accountDao: AccountDao,
        private readonly accountBalanceService: AccountBalanceService,
        private readonly httpService: HttpService,
    ) {}

    @Get('/balance/:date')
    public async getBalance(@RequestingUser() user: User, @Param('date') date: Date): Promise<BalanceDTO[]> {
        date = new Date(date);
        const accounts = await this.accountDao.getForUserId(user.id);
        //date = new Date(2021, 0, 0);
        const accountIds = accounts.map((a) => a.id); //[1, 5, 6, 4, 9, 8];

        // this.httpService.get('https://api.nbp.pl/api/exchangerates/rates/A/GBP/').subscribe((response) => {
        //     console.log(response.data);
        // });

        //const balance = await this.accountDao.getAccountBalanceForAccountAsOfDate(accountIds, date);
        //const balance = await this.accountBalanceService.getAccountsBalanceByIds(accountIds, date);
        return await this.accountBalanceService.getAccountsBalanceByIds(accountIds, date);
    }
}
