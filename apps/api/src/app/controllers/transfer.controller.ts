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

@Controller('transfer')
export class TransferController {
    constructor(
        private readonly transferDao: TransferDao,
        private readonly transfersService: TransfersService,
        private readonly etherealTransferService: EtherealTransferService,
        private readonly categoryDao: CategoryDao,
        private readonly accountDao: AccountDao,
        private readonly dateParserService: DateParserService,
        private readonly saveTransfersService: SaveTransfersService
    ) {}

    @Get(':transferId/details')
    async getTransferDetails(@Param('transferId') transferId: number): Promise<TransferDetailsDTO> {
        if (!transferId || transferId < 1) {
            throw new Error('Invalid ID provided.');
        }

        const transfer = await this.transferDao.getById(transferId);

        const categoryPath: Category[] = [];
        categoryPath.push(transfer.category);
        let parentCat = (await transfer.category.parent) ?? null;
        while (parentCat !== null) {
            if (!categoryPath.find((cat) => cat.id === parentCat?.id)) {
                categoryPath.push(parentCat);
                parentCat = (await categoryPath[categoryPath.length - 1]?.parent) ?? null;
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
            .map((t) => this.toTransferDTO(t));

        const receipt: ReceiptDTO = {
            id: transfer.receipt?.id ?? 0,
            description: transfer.receipt?.description ?? '',
            amount: transfer.receipt?.amount ?? null,
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
            receipt: receipt.id ? receipt : null,
            date: transfer.date,
            categoryPath: categoryPath.reverse().map((cat) => {
                return { id: cat.id, name: cat.name };
            }),
            isPlanned: transfer.date > new Date(),
            refundedBy: refundTransfer?.id,
            refundedOn: refundTransfer?.date.toJSON(),
            isRefundable: !transfer.metadata.refundedBy && !transfer.metadata.refundTargetId,
            isEthereal: transfer.isEthereal,
        };
    }

    private toTransferDTO(transfer: Transfer): TransferDTO {
        return {
            id: transfer.id,
            description: transfer.description,
            amount: transfer.amount,
            type: transfer.type,
            categoryId: transfer.category?.id,
            categoryName: transfer.category?.name,
            contractorId: transfer.contractor?.id ?? null,
            contractorName: transfer.contractor?.name ?? null,
            accountId: transfer.accountId,
            accountName: transfer.account.name,
            date: transfer.date,
            receiptId: transfer.receiptId ?? null,
        };
    }

    @Post(':transferId/commit')
    async commitTransfer(@Param('transferId') transferId: number): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new Error('Invalid ID provided.');
        }

        const transfer = await this.etherealTransferService.commit(transferId);
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        return {
            message: 'Transfer committed.',
        };
    }

    @Post(':transferId/stage')
    async stageTransfer(@Param('transferId') transferId: number): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new Error('Invalid ID provided.');
        }

        const transfer = await this.etherealTransferService.stage(transferId);
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        return {
            message: 'Transfer committed.',
        };
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
        entity.description = transfer.description === undefined ? category?.name : transfer.description;
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

    @Post(':transferId/split')
    async splitTransferObject(@Param('transferId') transferId: number, @Body() transfer: SplitTransferDTO): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new Error('Invalid ID provided.');
        }

        const target = await this.transferDao.getById(transferId);
        const category = await this.categoryDao.getById(parseInt(transfer.categoryId?.toString()));

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

    @Post(':transferId/refund')
    async refundTransfer(@Param('transferId') transferId: number, @Body() refundDTO: RefundTransferDTO): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new Error('Invalid ID provided.');
        }

        const refundTargetId = Math.floor(Number(refundDTO.refundTargetId));
        const refundDate = new Date(refundDTO.refundDate);

        const transfer = await this.transferDao.getById(transferId);

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
        refundTransferEntity.date = refundDate;
        refundTransferEntity.accountId = transfer.accountId;
        refundTransferEntity.metadata.refundTargetId = refundTargetId;
        refundTransferEntity.contractor = transfer.contractor;
        refundTransferEntity.receipt = transfer.receipt;

        const inserted = await this.transferDao.save(refundTransferEntity);

        transfer.metadata.refundedBy = inserted.id;

        await this.transferDao.save(transfer);
        return { insertedId: inserted.id, message: `Succesfully saved refund of ${transfer.description} #${transfer.id}.` };
    }

    @Post(':transferId/duplicate')
    async duplicateTransfer(@Param('transferId') transferId: number): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new Error('Invalid ID provided.');
        }

        const transfer = await this.transferDao.getById(transferId);

        if (!transfer) {
            throw new Error('Invalid Transfer ID.');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transfer as any).id = undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transfer as any).createdDate = undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transfer as any).editedDate = undefined;
        transfer.metadata.refundedBy = undefined;

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
