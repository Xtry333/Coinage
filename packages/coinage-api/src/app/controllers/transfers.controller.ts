import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { FilteredTransfersDTO, GetFilteredTransfersRequest, TransferDTO } from '@coinage-app/interfaces';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { TransferDao } from '../daos/transfer.dao';
import { UserDao } from '../daos/user.dao';
import { Transfer } from '../entities/Transfer.entity';
import { AccountBalanceService } from '../services/account-balance.service';
import { AuthGuard, RequestingUser } from '../services/auth.guard';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';
import { TransfersService } from '../services/transfers.service';

@UseGuards(AuthGuard)
@Controller('transfers')
export class TransfersController {
    public constructor(
        private readonly transferDao: TransferDao,
        private readonly transfersService: TransfersService,
        private readonly etherealTransferService: EtherealTransferService,
        private readonly categoryDao: CategoryDao,
        private readonly accountDao: AccountDao,
        private readonly accountBalanceService: AccountBalanceService,
        private readonly dateParserService: DateParserService,
        private readonly saveTransfersService: SaveTransfersService,
        private readonly userDao: UserDao,
    ) {}

    @Post('all')
    public async getAllFilteredTransfers(
        @RequestingUser('id') userId: number,
        @Body() filterParams: GetFilteredTransfersRequest,
    ): Promise<FilteredTransfersDTO> {
        filterParams.page = filterParams.page > 0 ? filterParams.page : 1;
        filterParams.rowsPerPage = filterParams.rowsPerPage > 0 ? filterParams.rowsPerPage : 100;

        if (filterParams.userId) {
            const user = await this.userDao.getById(userId);
            const userAccountIds = (await user.accounts).map((a) => a.id);
            filterParams.accountIds = filterParams.accountIds !== undefined ? [...filterParams.accountIds, ...userAccountIds] : userAccountIds;
        }

        const pagedTransfersDTOs = await this.transfersService.getAllFilteredPagedDTO(filterParams);
        const totalCount = await this.transfersService.getAllFilteredCount(filterParams);

        return {
            transfers: pagedTransfersDTOs,
            totalCount: totalCount,
        };
    }

    @Post('allPagedBatch')
    public async getAllTransfersFilteredMonthly(
        @RequestingUser('id') userId: number,
        @Body() filterParams: GetFilteredTransfersRequest,
    ): Promise<FilteredTransfersDTO> {
        filterParams.page = filterParams.page > 0 ? filterParams.page : 1;
        filterParams.rowsPerPage = filterParams.rowsPerPage > 0 ? filterParams.rowsPerPage : 100;

        if (filterParams.userId) {
            const user = await this.userDao.getById(userId);
            const userAccountIds = (await user.accounts).map((a) => a.id);
            filterParams.accountIds = filterParams.accountIds !== undefined ? [...filterParams.accountIds, ...userAccountIds] : userAccountIds;
        }

        const pagedTransfersDTOs = await this.transfersService.getAllFilteredPagedDTO(filterParams);
        const totalCount = await this.transfersService.getAllFilteredCount(filterParams);

        return {
            transfers: pagedTransfersDTOs,
            totalCount: totalCount,
        };
    }

    @Get('recent')
    public getRecentTransactions(@RequestingUser('id') userId: number): Promise<TransferDTO[]> {
        const recentCount = 10;
        return this.transfersService.getRecentTransfersForUserDTO(userId, recentCount);
    }

    @Get('/weekly/:id')
    public async getWeeklySpendings(@Param('id') id: string): Promise<any> {
        const idNum = parseInt(id);
        if (!idNum) {
            return {};
        }

        const transfers = await (await this.transferDao.getAll()).filter((t) => t.type === 'OUTCOME' && t.categoryId === idNum); //getByCategory(idNum);

        const weeks: { week: number; indetifier: string; outcomes: number }[] = [];
        transfers.forEach((transfer) => {
            const date = new Date(transfer.date);
            const indetifier = `${date.getFullYear()}.${this.getWeek(date).toString().padStart(2, '0')}`;
            //const indetifier = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const week = weeks.find((w) => w.indetifier === indetifier);
            if (week) {
                week.outcomes += transfer.amount;
            } else {
                weeks.push({
                    indetifier,
                    week: this.getWeek(date),
                    outcomes: transfer.amount,
                });
            }
        });

        return weeks.sort((a, b) => b.indetifier.localeCompare(a.indetifier));
    }

    public getWeek = function (date: Date) {
        const onejan = new Date(date.getFullYear(), 0, 1);
        const millisecsInDay = 86400000;
        return Math.ceil((((date as any) - (onejan as any)) / millisecsInDay + onejan.getDay() + 1) / 7);
    };
}
