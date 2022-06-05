import {
    BaseResponseDTO,
    CreateInternalTransferDTO,
    CreateInternalTransferDTOResponse,
    ReceiptDTO,
    RefundTransferDTO,
    SplitTransferDTO,
    TransferDetailsDTO,
    TransferDTO,
    CreateEditTransferModelDTO,
} from '@coinage-app/interfaces';
import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post } from '@nestjs/common';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Category } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { TransferItemsService } from '../services/transfer-items.service';
import { TransfersService } from '../services/transfers.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';

@Controller('transfer')
export class TransferController {
    private static INVALID_ID_MESSAGE = 'Invalid ID provided.';

    public constructor(
        private readonly transferDao: TransferDao,
        private readonly transfersService: TransfersService,
        private readonly etherealTransferService: EtherealTransferService,
        private readonly categoryDao: CategoryDao,
        private readonly contractorDao: ContractorDao,
        private readonly accountDao: AccountDao,
        private readonly receiptDao: ReceiptDao,
        private readonly dateParserService: DateParserService,
        private readonly saveTransfersService: SaveTransfersService,
        private readonly transferItemsService: TransferItemsService
    ) {}

    @Get(':transferId/details')
    public async getTransferDetails(@Param('transferId') transferId: number): Promise<TransferDetailsDTO> {
        if (!transferId || transferId < 1) {
            throw new BadRequestException(TransferController.INVALID_ID_MESSAGE);
        }

        const transfer = await this.transferDao.getById(transferId);

        transfer.transferItems.forEach((item) => {
            console.log(`${item.quantity}x ${item.item.name} (${item.unitPrice * item.quantity} PLN)`);
        });

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

        const receipt = await transfer.receipt;

        const receiptDto: ReceiptDTO | null = receipt
            ? {
                  id: receipt.id ?? 0,
                  description: receipt.description ?? '',
                  amount: receipt.amount ?? null,
                  date: receipt.date,
                  contractor: receipt.contractor?.name ?? '',
                  transferIds: receipt.transfers.map((t) => t.id) ?? [],
              }
            : null;

        return {
            id: transfer.id,
            description: transfer.description,
            amount: transfer.amount,
            type: transfer.category.type,
            createdDate: transfer.createdDate,
            editedDate: transfer.editedDate,
            contractor: transfer.contractor?.name,
            contractorId: transfer.contractor?.id,
            categoryId: transfer.category.id,
            account: { id: transfer.account?.id ?? 0, name: transfer.account?.name ?? '' },
            otherTransfers: otherTransfers,
            receipt: receiptDto,
            date: transfer.date,
            categoryPath: categoryPath.reverse().map((cat) => {
                return { id: cat.id, name: cat.name };
            }),
            items: transfer.transferItems.map((item) => {
                return {
                    id: item.itemId,
                    itemName: item.item.name,
                    unit: 'Units',
                    amount: item.quantity,
                    unitPrice: item.unitPrice,
                };
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
    public async commitTransfer(@Param('transferId') transferId: number): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new BadRequestException(TransferController.INVALID_ID_MESSAGE);
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
    public async stageTransfer(@Param('transferId') transferId: number): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new BadRequestException(TransferController.INVALID_ID_MESSAGE);
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
    public async saveTransferObject(@Body() transfer: CreateEditTransferModelDTO): Promise<BaseResponseDTO> {
        let entity: Transfer;
        const category = await this.categoryDao.getById(transfer.categoryId);
        const account = await this.accountDao.getById(transfer.accountId);
        const contractor = transfer.contractorId !== null ? await this.contractorDao.getById(transfer.contractorId) : null;
        const receipt = transfer.receiptId !== null ? await this.receiptDao.getById(transfer.receiptId) : null;

        if (transfer.id !== undefined) {
            entity = await this.transferDao.getById(transfer.id);
        } else {
            entity = new Transfer();
        }

        entity.description = transfer.description === undefined ? category?.name : transfer.description;
        entity.amount = transfer.amount;
        entity.date = transfer.date;
        entity.category = category;
        entity.categoryId = category.id;
        entity.type = category.type;

        entity.account = account;
        entity.accountId = account.id;

        // entity.contractor = contractor;
        entity.contractorId = contractor?.id ?? null;

        // entity.receipt = Promise.resolve(receipt);
        entity.receiptId = receipt?.id ?? null;

        if (entity.category.name === 'Paliwo') {
            try {
                entity.metadata = { unitPrice: parseFloat(entity.description.split(' ')[1].replace(',', '.')), location: entity.description.split(' ')[3] };
            } catch (e) {
                console.error('Could not set metadata for transfer on', entity.date);
                console.error(e);
            }
        }

        const inserted = await this.transfersService.saveTransfer(entity);

        // This will save items async in case of any issues with items not appearing in the transfer details
        const transferItems: TransferItem[] = [];
        transfer.items.forEach(async (item) => {
            if (item.id !== undefined) {
                const transferItem = new TransferItem();
                transferItem.itemId = item.id;
                transferItem.quantity = item.amount;
                transferItem.transferId = inserted.id;
                transferItem.unitPrice = item.price;
                transferItems.push(transferItem);
                await this.transferItemsService.save(transferItem);
            }
        });

        return { insertedId: inserted.id };
    }

    @Post(':transferId/split')
    public async splitTransferObject(@Param('transferId') transferId: number, @Body() transfer: SplitTransferDTO): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new BadRequestException(TransferController.INVALID_ID_MESSAGE);
        }

        const entity = new Transfer();
        const target = await this.transferDao.getById(transferId);
        const category = await this.categoryDao.getById(parseInt(transfer.categoryId?.toString()));

        if (category) {
            entity.category = category;
            entity.type = category.type;
        } else {
            throw new NotFoundException(`Cannot find category ${transfer.categoryId}`);
        }

        target.amount = target.amount - transfer.amount;
        entity.description = transfer.description.length > 0 ? transfer.description : category.name;
        entity.amount = transfer.amount;
        if (target.amount <= 0) {
            throw new BadRequestException('Amount too high! Create new transfer instead.');
        }
        entity.date = target.date;
        entity.accountId = target.accountId;

        entity.contractor = target.contractor;
        entity.receiptId = target.receiptId;
        const inserted = await this.transferDao.insert(entity);
        await this.transferDao.save(target);
        return { insertedId: inserted.identifiers[0].id };
    }

    @Post(':transferId/refund')
    public async refundTransfer(@Param('transferId') transferId: number, @Body() refundDTO: RefundTransferDTO): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new BadRequestException(TransferController.INVALID_ID_MESSAGE);
        }

        const refundTargetId = Math.floor(Number(refundDTO.refundTargetId));
        const refundDate = new Date(refundDTO.refundDate);

        const transfer = await this.transferDao.getById(transferId);

        const refundCategory = await this.categoryDao.getBySystemTag('system-refund');

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
    public async duplicateTransfer(@Param('transferId') transferId: number): Promise<BaseResponseDTO> {
        if (!transferId || transferId < 1) {
            throw new BadRequestException(TransferController.INVALID_ID_MESSAGE);
        }

        const transfer = await this.transferDao.getById(transferId);

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
    public async removeTransferObject(@Param('id') id: number) {
        // TODO: On remove delete refundedBy metadata from target
        //const refundTransfer = transfer.metadata.refundedBy ? await this.transferDao.getById(Number(transfer.metadata.refundedBy)) : undefined;
        return (await this.transferDao.deleteById(id)).affected == 1;
    }

    @Post('create/internal/:originId/:targetId')
    public async createInternalTransfer(
        @Body() transfer: CreateInternalTransferDTO,
        @Param('originId') originId: number,
        @Param('targetId') targetId: number
    ): Promise<CreateInternalTransferDTOResponse> {
        if (!originId || originId < 1 || !targetId || targetId < 1) {
            throw new BadRequestException(TransferController.INVALID_ID_MESSAGE);
        }

        console.log(transfer);
        console.log(transfer.date);
        console.log(originId, targetId);

        const originAccount = await this.accountDao.getById(originId);
        const targetAccount = await this.accountDao.getById(targetId);

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

        entityFrom.metadata.otherTransferId = insertedTo.id;
        entityTo.metadata.otherTransferId = insertedFrom.id;

        await this.transferDao.save(entityFrom);
        await this.transferDao.save(entityTo);

        return { originTransferId: insertedFrom.id, targetTransferId: insertedTo.id };
    }
}
