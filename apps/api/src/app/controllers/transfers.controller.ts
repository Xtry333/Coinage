import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import {
    BaseResponseDTO,
    CreateInternalTransferDTO,
    CreateInternalTransferDTOResponse,
    FilteredTransfersDTO,
    GetFilteredTransfersRequest,
    RefundTransferDTO,
    SaveTransferDTO,
    SplitTransferDTO,
    TotalAmountPerMonthDTO,
    TransferDetailsDTO,
    TransferDTO,
} from '@coinage-app/interfaces';
import { TransferDao } from '../daos/transfer.dao';
import { Category, TransferType } from '../entities/Category.entity';
import { AppService } from '../app.service';
import { CategoryDao } from '../daos/category.dao';
import { Transfer } from '../entities/Transfer.entity';
import { ContractorDao } from '../daos/contractor.dao';
import { AccountDao } from '../daos/account.dao';
import { DateParserService } from '../services/date-parser.service';

@Controller('transfer(s)?')
export class TransfersController {
    constructor(
        private readonly transferDao: TransferDao,
        private readonly appService: AppService,
        private readonly categoryDao: CategoryDao,
        private readonly contractorDao: ContractorDao,
        private readonly accountDao: AccountDao,
        private readonly dateParserService: DateParserService
    ) {}

    @Post('all')
    async getAllTransactions(@Body() filterParams: GetFilteredTransfersRequest): Promise<FilteredTransfersDTO> {
        filterParams.page = filterParams.page > 0 ? filterParams.page : 1;
        filterParams.rowsPerPage = filterParams.rowsPerPage > 0 ? filterParams.rowsPerPage : 100;

        const pagedTransfers = await this.transferDao.getAllFilteredPaged(filterParams);
        const totalCount = await this.transferDao.getAllFilteredCount(filterParams);

        return {
            transfers: pagedTransfers.map((t) => {
                return {
                    id: t.id,
                    description: t.description,
                    amount: parseFloat(t.amount),
                    type: t.type,
                    categoryId: t.category?.id,
                    category: t.category?.name,
                    contractor: t.contractor?.name,
                    account: t.account.name,
                    accountId: t.accountId,
                    date: t.date,
                    receiptId: t.receiptId,
                };
            }),
            totalCount: totalCount,
        };
    }

    @Get('recent')
    async getRecentTransactions(): Promise<TransferDTO[]> {
        const recentCount = 10;
        const accountIds = (await this.accountDao.getForUserId(1)).map((a) => a.id);
        return (
            (await this.transferDao.getRecent(accountIds, recentCount))
                //.sort((a, b) => b.editedDate.getTime() - a.editedDate.getTime())
                .map((t) => {
                    return {
                        id: t.id,
                        description: t.description,
                        amount: parseFloat(t.amount),
                        type: t.type,
                        categoryId: t.category?.id,
                        category: t.category?.name,
                        contractor: t.contractor?.name,
                        account: t.account.name,
                        accountId: t.account.id,
                        date: t.date,
                        receiptId: t.receiptId,
                    };
                })
        );
    }

    @Get('details/:id')
    async getTransferDetails(@Param('id') paramId: string): Promise<TransferDetailsDTO> {
        const id = parseInt(paramId);
        if (!id) {
            throw new Error('Invalid ID provided');
        }
        const transfer = await this.transferDao.getById(id);
        const categoryPath: Category[] = [];
        categoryPath.push(transfer.category);
        let parentCat = await transfer.category.parent;
        while (parentCat !== null) {
            if (!categoryPath.find((cat) => cat.id === parentCat?.id)) {
                categoryPath.push(parentCat);
                parentCat = await categoryPath[categoryPath.length - 1]?.parent;
            } else {
                break;
            }
        }

        let refundTransfer: Transfer | undefined;
        try {
            refundTransfer = transfer.metadata.refundedBy ? await this.transferDao.getById(Number(transfer.metadata.refundedBy)) : undefined;
        } catch (e) {
            console.log(e);
            delete transfer.metadata.refundedBy;
            this.transferDao.save(transfer);
        }

        const otherTransfers: TransferDTO[] = (await this.transferDao.getTransferByDateContractor(transfer.date, transfer.contractor?.id ?? 0))
            .filter((t) => t.id !== transfer.id)
            .map((t) => {
                return {
                    id: t.id,
                    description: t.description,
                    amount: parseFloat(t.amount),
                    type: t.type,
                    category: t.category.name,
                    accountId: t.account.id,
                    account: t.account.name,
                    date: t.date,
                    categoryId: t.category.id,
                };
            });
        const receipt = {
            id: transfer.receipt?.id ?? 0,
            description: transfer.receipt?.description ?? '',
            amount: parseFloat(transfer.receipt?.amount ?? '0'),
            date: transfer.receipt?.date,
            contractor: transfer.receipt?.contractor?.name ?? '',
            transferIds: (await transfer.receipt?.transfers)?.map((t) => t.id) ?? [],
        };

        return {
            id: transfer.id,
            description: transfer.description,
            amount: Number(transfer.amount),
            type: transfer.category.type,
            createdDate: transfer.createdDate,
            editedDate: transfer.editedDate,
            contractor: transfer.contractor?.name,
            contractorId: transfer.contractor?.id,
            categoryId: transfer.category.id,
            account: { id: transfer.account?.id ?? 0, name: transfer.account?.name ?? '' },
            otherTransfers: otherTransfers,
            receipt: receipt.id ? receipt : undefined,
            date: transfer.date,
            categoryPath: categoryPath.reverse().map((cat) => {
                return { id: cat.id, name: cat.name };
            }),
            isPlanned: new Date(transfer.date) > new Date(),
            refundedBy: refundTransfer?.id,
            refundedOn: refundTransfer?.date,
            isRefundable: !transfer.metadata.refundedBy && !transfer.metadata.refundTargetId,
        };
    }

    @Get('/totalOutcomesPerMonth')
    async getLastTotalOutcomesPerMonth(): Promise<TotalAmountPerMonthDTO[]> {
        const accountIds = (await this.accountDao.getForUserId(1)).map((a) => a.id);
        // TODO: Join queries into one async
        const outcomes = (await this.transferDao.getLimitedTotalMonthlyAmount(accountIds, TransferType.Outcome)).map((outcome) => {
            return {
                year: outcome.year,
                month: outcome.month - 1,
                amount: parseFloat(outcome.amount),
                transactionsCount: outcome.count,
            };
        });
        const incomes = (await this.transferDao.getLimitedTotalMonthlyAmount(accountIds, TransferType.Income)).map((income) => {
            return {
                year: income.year,
                month: income.month - 1,
                amount: parseFloat(income.amount),
                transactionsCount: income.count,
            };
        });

        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();

        for (let i = 0; i < 12; i++) {
            if (!outcomes.find((o) => o.year === year && o.month === month)) {
                outcomes.push({
                    year: year,
                    month: month,
                    amount: 0,
                    transactionsCount: 0,
                });
            }
            month--;
            if (month < 0) {
                year--;
                month = 11;
            }
        }
        return outcomes
            .sort((a, b) => new Date(b.year, b.month).getTime() - new Date(a.year, a.month).getTime())
            .slice(0, 12)
            .map((o) => {
                return {
                    ...o,
                    outcomes: o.amount,
                    incomes: incomes.find((i) => i.year === o.year && i.month === o.month)?.amount ?? 0,
                };
            });
    }

    @Post('save')
    async saveTransferObject(@Body() transfer: SaveTransferDTO): Promise<BaseResponseDTO> {
        console.log(transfer);
        console.log(transfer.date);
        let entity: Transfer;
        const category = await this.categoryDao.getById(parseInt(transfer.categoryId?.toString()));
        const account = (await transfer.accountId) ? await this.accountDao.getById(parseInt(transfer.accountId?.toString())) : undefined;

        if (!account) {
            throw new Error('Account not found');
        }
        //const account = await this.accc.getById(parseInt(transfer.categoryId?.toString()));
        if (transfer.id) {
            entity = await this.transferDao.getById(transfer.id);
        } else {
            entity = new Transfer();
        }
        entity.description = transfer.description;
        entity.amount = transfer.amount.toString();
        entity.date = transfer.date;
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
        entity.account = account;
        entity.contractor = transfer.contractorId ? await this.contractorDao.getById(parseInt(transfer.contractorId?.toString())) : undefined;
        if (entity.category.name === 'Paliwo') {
            try {
                entity.metadata = { unitPrice: parseFloat(entity.description.split(' ')[1].replace(',', '.')), location: entity.description.split(' ')[3] };
            } catch (e) {
                console.log('Could not set metadata for transfer on', entity.date);
                console.log(e);
            }
        }
        console.log(entity);
        const inserted = await this.transferDao.save(entity);
        return { insertedId: inserted.id };
    }

    @Post('split')
    async splitTransferObject(@Body() transfer: SplitTransferDTO): Promise<BaseResponseDTO> {
        const category = await this.categoryDao.getById(parseInt(transfer.categoryId?.toString()));
        const id = parseInt(transfer.id?.toString());
        const target = await this.transferDao.getById(id);
        target.amount = (parseFloat(target.amount) - transfer.amount).toString();
        const entity = new Transfer();
        entity.description = transfer.description;
        entity.amount = transfer.amount.toString();
        if (parseFloat(target.amount) <= 0) {
            throw new Error('Amount too high!');
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

    @Post('refund')
    async refundTransfer(@Body() refundDTO: RefundTransferDTO): Promise<BaseResponseDTO> {
        const refundTargetId = Math.floor(Number(refundDTO.refundTargetId));
        const refundDate = new Date(refundDTO.refundDate);

        const transfer = await this.transferDao.getById(refundTargetId);

        const refundCategory = await this.categoryDao.getBySystemTag('system-refund');

        if (!transfer) {
            throw new Error('Invalid Transfer ID.');
        }

        if (transfer.metadata.refundedBy || transfer.metadata.refundTargetId) {
            throw new Error('Cannot refund a refund or a refund target.');
        }
        const refundTransferEntity = new Transfer();
        refundTransferEntity.description = `Refund: ${transfer.description}`;
        refundTransferEntity.amount = transfer.amount;
        refundTransferEntity.type = refundCategory.type;
        refundTransferEntity.categoryId = refundCategory.id;
        refundTransferEntity.date = this.dateParserService.formatMySql(refundDate);
        refundTransferEntity.accountId = transfer.accountId;
        refundTransferEntity.metadata.refundTargetId = refundTargetId;
        refundTransferEntity.contractor = transfer.contractor;

        const inserted = await this.transferDao.save(refundTransferEntity);

        transfer.metadata.refundedBy = inserted.id;

        await this.transferDao.save(transfer);
        return { insertedId: inserted.id, message: `Succesfully saved refund of ${transfer.description} #${transfer.id}.` };
    }

    @Post(':id/duplicate')
    async duplicateTransfer(@Param('id') paramId: string): Promise<BaseResponseDTO> {
        const id = parseInt(paramId);
        const transfer = await this.transferDao.getById(id);

        if (!transfer) {
            throw new Error('Invalid Transfer ID.');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transfer as any).id = undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transfer as any).createdDate = undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transfer as any).editedDate = undefined;

        const inserted = await this.transferDao.save(transfer);
        return { insertedId: inserted.id };
    }

    @Delete(':id')
    async removeTransferObject(@Param('id') id: number) {
        // TODO: On remove delete refundedBy metadata from target
        //const refundTransfer = transfer.metadata.refundedBy ? await this.transferDao.getById(Number(transfer.metadata.refundedBy)) : undefined;
        return (await this.transferDao.deleteById(id)).affected == 1;
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
                week.outcomes += parseFloat(transfer.amount);
            } else {
                weeks.push({
                    indetifier,
                    week: this.getWeek(date),
                    outcomes: parseFloat(transfer.amount),
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
        entityFrom.amount = transfer.amount.toString();
        entityFrom.categoryId = categoryFrom.id;
        entityFrom.accountId = originAccount.id;
        entityFrom.date = transfer.date;
        entityFrom.type = categoryFrom.type;
        entityFrom.isInternal = true;

        entityTo.description = transfer.description;
        entityTo.amount = transfer.amount.toString();
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
