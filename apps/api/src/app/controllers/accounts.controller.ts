import { Controller, Get, Param } from '@nestjs/common';

import { AccountDetailsDTOResponse, AccountDTO, BalanceDTO } from '@coinage-app/interfaces';
import { AccountDao } from '../daos/account.dao';
import { DateParserService } from '../services/date-parser.service';

@Controller('account')
export class AccountsController {
    constructor(private readonly accountDao: AccountDao, private readonly dateParser: DateParserService) {}

    @Get('all')
    async getAllTransactions(): Promise<AccountDTO[]> {
        const currentUserId = 1;
        return await this.accountDao.getForUserId(currentUserId);
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

    @Get('spendings')
    async getTotalSpendingsAsOfToday(): Promise<BalanceDTO[]> {
        const asOfDate = new Date().toISOString().split('T')[0];
        const accountIds = await this.accountDao.getForUserId(1);
        return this.getAccountSpendingsAsOfDate({ accountIds: accountIds.map((a) => a.id).join(','), asOfDate: asOfDate });
    }

    @Get('spendings/:accountId')
    async getAccountSpendingsAsOfToday(@Param() params: { [key: string]: string }): Promise<BalanceDTO[]> {
        const asOfDate = new Date().toISOString().split('T')[0];
        return this.getAccountSpendingsAsOfDate({ accountIds: params.accountId, asOfDate: asOfDate });
    }

    @Get('spendings/:accountId/:asOfDate')
    async getAccountSpendingsAsOfDate(@Param() params: { [key: string]: string }): Promise<BalanceDTO[]> {
        const accountIds = params.accountIds.split(',').map((id) => parseInt(id, 10));
        const asOfDate = new Date(params.asOfDate);
        const userId = 1;

        if (!accountIds || !asOfDate || asOfDate.toString() === 'Invalid Date') {
            throw new Error('Invalid parameters');
        }
        const balanceDTOs = await this.accountDao.getSpendingsAsOfDate(accountIds, asOfDate, userId);
        if (balanceDTOs.length === 0) {
            return [
                {
                    accountId: 0,
                    name: '',
                    balance: 0,
                },
            ];
        } else {
            return balanceDTOs;
        }
    }

    @Get('details/:accountId')
    async getAccountDetailedStatistics(@Param() params: { [key: string]: string }): Promise<AccountDetailsDTOResponse> {
        const accountId = Number(params.accountId);

        if (!accountId) {
            throw new Error(`Invalid account ID: ${accountId}`);
        }

        const account = await this.accountDao.getById(accountId);
        const balance = await this.accountDao.getAccountBalance([accountId]);
        const freeBalanceNextMonth = await this.accountDao.getAccountBalanceForAccountAsOfDate([accountId], this.dateParser.getEndOfCurrentMonthDate());
        const next30DaysDate = new Date();
        next30DaysDate.setDate(next30DaysDate.getDate() + 30);
        const freeBalanceNext30Days = await this.accountDao.getAccountBalanceForAccountAsOfDate([accountId], next30DaysDate);

        return {
            id: account.id,
            name: account.name,
            ownerId: account.userId,
            currentBalance: balance[0]?.balance ?? 0,
            freeBalanceUntilNextMonth: freeBalanceNextMonth[0]?.balance ?? 0,
            freeBalanceInNext30Days: freeBalanceNext30Days[0]?.balance ?? 0,
            plannedSpendingsUntilNextMonth: balance[0]?.balance - freeBalanceNextMonth[0]?.balance ?? 0,
            currency: '',
            isOpen: account.isActive,
            openDate: account.createdDate.toString(),
            statistics: {
                allTime: {
                    incomes: 0,
                    expenses: 0,
                    balance: 0,
                    transferCount: 0,
                },
                lastMonth: {
                    incomes: 0,
                    expenses: 0,
                    balance: 0,
                    transferCount: 0,
                },
                lastYear: {
                    incomes: 0,
                    expenses: 0,
                    balance: 0,
                    transferCount: 0,
                },
                plannedTransfers: {
                    incomes: 0,
                    expenses: 0,
                    transferCount: 0,
                },
                firstTransferDate: '',
                lastTransferDate: '',
            },
        };
    }
}
