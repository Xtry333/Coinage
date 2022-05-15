import { Controller, Delete, Get, Param, ParseArrayPipe, Query } from '@nestjs/common';

import { AccountDetailsDTOResponse, AccountDTO, BalanceDTO, BaseResponseDTO, MonthlyUserStatsDTO } from '@coinage-app/interfaces';
import { AccountDao } from '../daos/account.dao';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';

@Controller('account(s)?')
export class AccountsController {
    public constructor(
        private readonly accountDao: AccountDao,
        private readonly etherealTransferService: EtherealTransferService,
        private readonly dateParser: DateParserService
    ) {}

    @Get('all')
    public async getAllTransactions(): Promise<AccountDTO[]> {
        const currentUserId = 1;
        return await this.accountDao.getForUserId(currentUserId);
    }

    @Get('balance/:accountId/:asOfDate')
    public async getAccountBalanceAsOfDate(@Param() params: { [key: string]: string }): Promise<BalanceDTO[]> {
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

    @Get('spendings/:date')
    public async getTotalSpendingsAsOfToday(@Param('date') date: Date): Promise<BalanceDTO[]> {
        const accountIds = await this.accountDao.getForUserId(1);
        return this.getAccountSpendingsAsOfDate({ accountIds: accountIds.map((a) => a.id).join(','), asOfDate: date.toISOString() });
    }

    @Get(':accountIds/spendings')
    public async getAccountSpendingsAsOfToday(@Param() params: { [key: string]: string }): Promise<BalanceDTO[]> {
        const asOfDate = new Date().toISOString().split('T')[0];
        return this.getAccountSpendingsAsOfDate({ accountIds: params.accountIds, asOfDate: asOfDate });
    }

    @Get(':accountIds/spendings/:asOfDate')
    public async getAccountSpendingsAsOfDate(@Param() params: { [key: string]: string }): Promise<BalanceDTO[]> {
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

    @Get('/lastYearMonthlyStats')
    public async getMongthlyStats(
        @Query('accountIds', new ParseArrayPipe({ expectedType: Number, items: Number, optional: true })) accountIds?: number[]
    ): Promise<MonthlyUserStatsDTO[]> {
        let accounts = await this.accountDao.getForUserId(1);
        let shouldUseAllAccounts = true;
        if (accountIds !== undefined) {
            accounts = await this.accountDao.getByIds(accountIds);
            shouldUseAllAccounts = false;
        } else {
            accountIds = accounts.map((a) => a.id);
        }
        const monthlyStats = (await this.accountDao.getLast12MonthStats(accountIds, shouldUseAllAccounts)).map((stats) => {
            return {
                year: stats.year,
                month: stats.month - 1,
                income: parseFloat(stats.income),
                outcome: parseFloat(stats.outcome),
                change: parseFloat(stats.income) - parseFloat(stats.outcome),
                transactionsCount: parseInt(stats.count),
            };
        });

        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();

        for (let i = 0; i < 12; i++) {
            if (monthlyStats.find((entry) => entry.year === year && entry.month === month) === undefined) {
                monthlyStats.push({
                    year: year,
                    month: month,
                    income: 0,
                    outcome: 0,
                    change: 0,
                    transactionsCount: 0,
                });
            }
            month--;
            if (month < 0) {
                year--;
                month = 11;
            }
        }
        const last12Months = monthlyStats.sort((a, b) => new Date(b.year, b.month).getTime() - new Date(a.year, a.month).getTime()).slice(0, 12);
        const date = this.dateParser.getEndOfMonth(last12Months[11].year, last12Months[11].month - 1);

        let initialBalance = (await this.accountDao.getAccountBalanceForAccountAsOfDate(accountIds, date)).reduce((acc, curr) => {
            return acc + curr.balance;
        }, 0);

        const b: MonthlyUserStatsDTO[] = last12Months.map((o) => {
            return {
                ...o,
                outcomes: o.outcome,
                incomes: o.income,
                balance: o.income - o.outcome,
                selectedAccounts: accounts.map((a) => {
                    return {
                        id: a.id,
                        name: a.name,
                    };
                }),
            };
        });

        b.reverse().forEach((m) => {
            initialBalance = m.balance + initialBalance;
            m.balance = initialBalance;
        });
        return b.reverse();
    }

    @Delete(':id/ethereals')
    public async stageTransfer(@Param('id') paramId: number): Promise<BaseResponseDTO> {
        const count = await this.etherealTransferService.cleanupUser(paramId);
        // TODO: fix endpoint

        return {
            message: `Cleared ${count} ethereal transfer${count === 1 ? '' : 's'}.`,
        };
    }

    @Get('details/:accountId')
    public async getAccountDetailedStatistics(@Param() params: { [key: string]: string }): Promise<AccountDetailsDTOResponse> {
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
