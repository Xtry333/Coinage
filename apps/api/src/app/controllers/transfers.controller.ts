import {
    BaseResponseDTO,
    CreateInternalTransferDTO,
    CreateInternalTransferDTOResponse,
    FilteredTransfersDTO,
    GetFilteredTransfersRequest,
    ReceiptDTO,
    RefundTransferDTO,
    SplitTransferDTO,
    TransferDetailsDTO,
    TransferDTO,
    CreateEditTransferModelDTO,
} from '@coinage-app/interfaces';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Category } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { TransfersService } from '../services/transfers.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';

@Controller('transfers')
export class TransfersController {
    constructor(
        private readonly transferDao: TransferDao,
        private readonly transfersService: TransfersService,
        private readonly etherealTransferService: EtherealTransferService,
        private readonly categoryDao: CategoryDao,
        private readonly accountDao: AccountDao,
        private readonly dateParserService: DateParserService,
        private readonly saveTransfersService: SaveTransfersService
    ) {}

    @Post('all')
    async getAllFilteredTransfers(@Body() filterParams: GetFilteredTransfersRequest): Promise<FilteredTransfersDTO> {
        filterParams.page = filterParams.page > 0 ? filterParams.page : 1;
        filterParams.rowsPerPage = filterParams.rowsPerPage > 0 ? filterParams.rowsPerPage : 100;

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

    @Post('save')
    async saveTransferObject(@Body() transfer: CreateEditTransferModelDTO): Promise<BaseResponseDTO> {
        let entity: Transfer;
        const category = await this.categoryDao.getById(parseInt(transfer.categoryId?.toString()));
        const account = (await transfer.accountId) ? await this.accountDao.getById(parseInt(transfer.accountId?.toString())) : undefined;

        if (!account) {
            throw new Error('Account not found');
        }
        //const account = await this.accc.getById(parseInt(transfer.categoryId?.toString()));
        if (transfer.id !== undefined) {
            entity = await this.transferDao.getById(transfer.id);
        } else {
            entity = new Transfer();
        }
        entity.amount = transfer.amount;
        entity.date = transfer.date as any; // TODO: Fix date string
        if (!entity.createdDate) {
            entity.createdDate = new Date();
        }
        entity.editedDate = new Date();
        if (category) {
            entity.category = category;
            entity.type = category.type;
        } else {
            return {
                error: `Cannot find category ${transfer.categoryId}`,
            };
            // throw new Error(`Cannot find category ${transfer.categoryId}`);
        }
        entity.description = transfer.description === undefined || transfer.description.length === 0 ? category?.name : transfer.description;
        entity.account = account;
        delete entity.contractor; // = transfer.contractorId ? await this.contractorDao.getById(parseInt(transfer.contractorId?.toString())) : undefined;
        entity.contractorId = transfer.contractorId;
        if (entity.category.name === 'Paliwo') {
            try {
                entity.metadata = { unitPrice: parseFloat(entity.description.split(' ')[1].replace(',', '.')), location: entity.description.split(' ')[3] };
            } catch (e) {
                console.log('Could not set metadata for transfer on', entity.date);
                console.log(e);
            }
        }
        const inserted = await this.transfersService.saveTransfer(entity);
        return { insertedId: inserted.id };
    }

    @Post('split')
    async splitTransferObject(@Body() transfer: SplitTransferDTO): Promise<BaseResponseDTO> {
        const category = await this.categoryDao.getById(parseInt(transfer.categoryId?.toString()));
        const id = parseInt(transfer.id?.toString());
        const target = await this.transferDao.getById(id);
        target.amount = target.amount - transfer.amount;
        const entity = new Transfer();
        entity.description = transfer.description;
        entity.amount = transfer.amount;
        if (target.amount <= 0) {
            throw new Error('Amount too high! Create new transfer instead');
        }
        entity.date = target.date;
        entity.accountId = target.accountId;
        if (!entity.createdDate) {
            entity.createdDate = new Date();
        }
        entity.editedDate = new Date();
        if (category) {
            entity.category = category;
            entity.type = category.type;
        } else {
            throw new Error(`Cannot find category ${transfer.categoryId}`);
        }
        entity.contractor = target.contractor;
        entity.receiptId = target.receiptId;
        const inserted = await this.transferDao.insert(entity);
        await this.transferDao.save(target);
        return { insertedId: inserted.identifiers[0].id };
    }

    @Get('/weekly/:id')
    async getWeeklySpendings(@Param('id') id: string): Promise<any> {
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

    getWeek = function (date: Date) {
        const onejan = new Date(date.getFullYear(), 0, 1);
        const millisecsInDay = 86400000;
        return Math.ceil((((date as any) - (onejan as any)) / millisecsInDay + onejan.getDay() + 1) / 7);
    };

    @Post('create/internal/:originId/:targetId')
    async createInternalTransfer(
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
