import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { BaseResponseDTO, BulkDeleteTransferDTO, BulkEditTransferDTO, FilteredTransfersDTO, GetFilteredTransfersRequest, TransferDTO } from '@app/interfaces';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { ScheduleDao } from '../daos/schedule.dao';
import { TransferDao } from '../daos/transfer.dao';
import { UserDao } from '../daos/user.dao';
import { AccountBalanceService } from '../services/account-balance.service';
import { AuthGuard, RequestingUser } from '../services/auth.guard';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { TransfersService } from '../services/transfers.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';

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
        private readonly scheduleDao: ScheduleDao,
        private readonly receiptDao: ReceiptDao,
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

    @Post('bulk-edit')
    public async bulkEditTransfers(@RequestingUser('id') userId: number, @Body() request: BulkEditTransferDTO): Promise<BaseResponseDTO> {
        try {
            // Verify ownership of all transfers
            const transfers = await this.transferDao.findByIds(request.transferIds);

            // Filter transfers that belong to the user
            const userAccountIds = (await (await this.userDao.getById(userId)).accounts).map((a) => a.id);
            const userTransfers = transfers.filter((t) => userAccountIds.includes(t.originAccountId));

            if (userTransfers.length !== request.transferIds.length) {
                return { error: 'Some transfers not found or not owned by user' };
            }

            // Validate schedule if provided
            if (request.scheduleId !== undefined) {
                try {
                    await this.scheduleDao.getById(request.scheduleId);
                } catch (error) {
                    return { error: 'Schedule not found' };
                }
            }

            // Validate receipt if provided
            if (request.receiptId !== undefined) {
                try {
                    await this.receiptDao.getById(request.receiptId);
                } catch (error) {
                    return { error: 'Receipt not found' };
                }
            }

            // Update transfers
            const updateData: any = {};
            if (request.description !== undefined) updateData.description = request.description;
            if (request.categoryId !== undefined) updateData.categoryId = request.categoryId;
            if (request.contractorId !== undefined) updateData.contractorId = request.contractorId;
            if (request.accountId !== undefined) updateData.accountId = request.accountId;
            if (request.date !== undefined) updateData.date = request.date;
            if (request.scheduleId !== undefined) updateData.scheduleId = request.scheduleId;
            if (request.receiptId !== undefined) updateData.receiptId = request.receiptId;

            await this.transferDao.bulkUpdate(request.transferIds, updateData);

            return { insertedId: request.transferIds.length };
        } catch (error) {
            console.error('Bulk edit error:', error);
            return { error: 'Failed to update transfers' };
        }
    }

    @Post('bulk-delete')
    public async bulkDeleteTransfers(@RequestingUser('id') userId: number, @Body() request: BulkDeleteTransferDTO): Promise<BaseResponseDTO> {
        try {
            // Verify ownership of all transfers
            const transfers = await this.transferDao.findByIds(request.transferIds);

            // Filter transfers that belong to the user
            const userAccountIds = (await (await this.userDao.getById(userId)).accounts).map((a) => a.id);
            const userTransfers = transfers.filter((t) => userAccountIds.includes(t.originAccountId));

            if (userTransfers.length !== request.transferIds.length) {
                return { error: 'Some transfers not found or not owned by user' };
            }

            // Delete transfers
            await this.transferDao.bulkDelete(request.transferIds);

            return { insertedId: request.transferIds.length };
        } catch (error) {
            console.error('Bulk delete error:', error);
            return { error: 'Failed to delete transfers' };
        }
    }
}
