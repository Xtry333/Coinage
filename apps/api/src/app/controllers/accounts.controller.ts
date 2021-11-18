import { Controller, Get, Param } from '@nestjs/common';

import { AccountDTO, BalanceDTO } from '@coinage-app/interfaces';
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
    async getAccountBalanceAsOfDate(@Param() params: { [key: string]: string }): Promise<BalanceDTO[]> {
        const accountIds = params.accountId.split(',').map((id) => parseInt(id, 10));
        const asOfDate = new Date(params.asOfDate);
        if (!accountIds || !asOfDate || asOfDate.toString() === 'Invalid Date') {
            throw new Error('Invalid parameters');
        }
        const balanceDTOs = await this.accountDao.getAccountBalanceForAccountAsOfDate(accountIds, asOfDate);
        if (balanceDTOs.length === 0) {
            return [];
        } else {
            return balanceDTOs;
        }
    }
}
