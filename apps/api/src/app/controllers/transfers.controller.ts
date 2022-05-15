import {
    BaseResponseDTO,
    CreateInternalTransferDTO,
    CreateInternalTransferDTOResponse,
    FilteredTransfersDTO,
    GetFilteredTransfersRequest,
    SplitTransferDTO,
    TransferDTO,
    CreateEditTransferModelDTO,
} from '@coinage-app/interfaces';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { TransferDao } from '../daos/transfer.dao';
import { UserDao } from '../daos/user.dao';
import { Transfer } from '../entities/Transfer.entity';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { TransfersService } from '../services/transfers.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';

@Controller('transfers')
export class TransfersController {
    public constructor(
        private readonly transferDao: TransferDao,
        private readonly transfersService: TransfersService,
        private readonly etherealTransferService: EtherealTransferService,
        private readonly categoryDao: CategoryDao,
        private readonly accountDao: AccountDao,
        private readonly dateParserService: DateParserService,
        private readonly saveTransfersService: SaveTransfersService,
        private readonly userDao: UserDao
    ) {}

    @Post('all')
    public async getAllFilteredTransfers(@Body() filterParams: GetFilteredTransfersRequest): Promise<FilteredTransfersDTO> {
        filterParams.page = filterParams.page > 0 ? filterParams.page : 1;
        filterParams.rowsPerPage = filterParams.rowsPerPage > 0 ? filterParams.rowsPerPage : 100;

        if (filterParams.userId) {
            const user = await this.userDao.getById(filterParams.userId);
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
    public getRecentTransactions(): Promise<TransferDTO[]> {
        const recentCount = 10;
        const userId = 1;
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

    @Post('create/internal/:originId/:targetId')
    public async createInternalTransfer(
        @Body() transfer: CreateInternalTransferDTO,
        @Param('originId') originId: string,
        @Param('targetId') targetId: string
    ): Promise<CreateInternalTransferDTOResponse> {
        console.log(transfer);
        console.log(transfer.date);
        console.log(originId, targetId);

        const originAccount = await this.accountDao.getById(parseInt(originId));
        const targetAccount = await this.accountDao.getById(parseInt(targetId));

        if (!originAccount) {
            throw new Error(`Cannot find origin account id ${originId}`);
        }
        if (!targetAccount) {
            throw new Error(`Cannot find target account id ${targetId}`);
        }

        const categoryFrom = await this.categoryDao.getBySystemTag('system-outcome');
        const categoryTo = await this.categoryDao.getBySystemTag('system-income');

        const entityFrom = new Transfer(),
            entityTo = new Transfer();

        entityFrom.description = transfer.description;
        entityFrom.amount = transfer.amount;
        entityFrom.categoryId = categoryFrom.id;
        entityFrom.accountId = originAccount.id;
        entityFrom.date = transfer.date;
        entityFrom.type = categoryFrom.type;
        entityFrom.isInternal = true;

        entityTo.description = transfer.description;
        entityTo.amount = transfer.amount;
        entityTo.categoryId = categoryTo.id;
        entityTo.accountId = targetAccount.id;
        entityTo.date = transfer.date;
        entityTo.type = categoryTo.type;
        entityTo.isInternal = true;

        const insertedFrom = await this.transferDao.save(entityFrom);
        const insertedTo = await this.transferDao.save(entityTo);
        return { originTransferId: insertedFrom.id, targetTransferId: insertedTo.id };
    }
}
