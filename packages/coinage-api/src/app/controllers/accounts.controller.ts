import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';

import { AccountDetailsDTOResponse, AccountDTO, BalanceDTO, BaseResponseDTO, NewMonthlyUserStatsDTO } from '@app/interfaces';

import { AccountDao } from '../daos/account.dao';
import { User } from '../entities/User.entity';
import { AccountBalanceService } from '../services/account-balance.service';
import { AccountsService } from '../services/accounts/accounts.service';
import { AuthGuard, RequestingUser } from '../services/auth.guard';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';

@UseGuards(AuthGuard)
@Controller('account(s)?')
export class AccountsController {
    public constructor(
        private readonly accountDao: AccountDao,
        private readonly accountsService: AccountsService,
        private readonly etherealTransferService: EtherealTransferService,
        private readonly dateParser: DateParserService,
        private readonly accountBalanceService: AccountBalanceService,
    ) {}

    @Get('all')
    public async getAccountsForUserId(@RequestingUser('id') userId: number): Promise<AccountDTO[]> {
        return await this.accountsService.getForUserId(userId);
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
        date = new Date(date);
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
                    currencySymbol: '',
                    balance: 0,
                },
            ];
        } else {
            return balanceDTOs;
        }
    }

    @Get('/lastYearMonthlyStats')
    public async getMongthlyStats(@RequestingUser() user: User): Promise<NewMonthlyUserStatsDTO[]> {
        return this.accountBalanceService.getMonthlyAccountsBalanceForUserId(user.id);
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

        // TODO: Implementation temporarily ignored as per user request.
        return undefined as any;
    }
}
