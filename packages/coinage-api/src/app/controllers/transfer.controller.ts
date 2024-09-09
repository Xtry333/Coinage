import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';

import {
    BaseResponseDTO,
    ReceiptDTO,
    RefundTransferDTO,
    SplitTransferDTO,
    TransferDetailsDTO,
    TransferDTO,
    CreateEditTransferModelDTO,
    TransferType,
    CreateMultipleTransfersDTO,
} from '@coinage-app/interfaces';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Category } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { User } from '../entities/User.entity';
import { AuthGuard, RequestingUser } from '../services/auth.guard';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { ItemsService } from '../services/items.service';
import { TransferItemsService } from '../services/transfer-items.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';
import { TransfersService } from '../services/transfers.service';

@UseGuards(AuthGuard)
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
        private readonly itemsService: ItemsService,
        private readonly transferItemsService: TransferItemsService
    ) {}

    @Get(':transferId/details')
    public async getTransferDetails(@Param('transferId') transferId: number): Promise<TransferDetailsDTO> {
        if (!transferId || transferId < 1) {
            throw new BadRequestException(TransferController.INVALID_ID_MESSAGE);
        }

        const transfer = await this.transferDao.getById(transferId);

        // transfer.transferItems.forEach((item) => {
        //     console.log(`${item.quantity}x ${item.item.name} (${item.unitPrice * item.quantity} PLN)`);
        // });

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
            console.error(e);
            delete transfer.metadata.refundedBy;
            this.transferDao.save(transfer);
        }

        const otherTransfers: TransferDTO[] = (await this.transferDao.getTransfersByDate(transfer.date))
            // .filter((t) => t.id !== transfer.id)
            .map((t) => this.toTransferDTO(t));

        const receipt = await transfer.receipt;

        const receiptDto: ReceiptDTO | null = receipt
            ? {
                  id: receipt.id,
                  description: receipt.description,
                  amount: receipt.amount,
                  date: receipt.date,
                  contractor: receipt.contractor?.name ?? '',
                  transferIds: receipt.transfers.map((t) => t.id) ?? [],
              }
            : null;

        if (transfer.targetAccountId == 17 && transfer.targetAccount && transfer.contractor) {
            transfer.targetAccount.name = `${transfer.contractor.name} [Contractor]`;
        }

        const transferType = transfer.originAccount.userId === transfer.targetAccount?.userId ? TransferType.INTERNAL.value : transfer.type;
        return {
            id: transfer.id,
            description: transfer.description,
            amount: transfer.amount,
            type: transferType,
            date: transfer.date,
            accountingDate: transfer.accountingDate,
            createdDate: transfer.createdDate,
            editedDate: transfer.editedDate,
            contractor: transfer.contractor?.name,
            contractorId: transfer.contractor?.id,
            categoryId: transfer.category.id,
            account: { id: transfer.originAccount?.id ?? 0, name: transfer.originAccount?.name ?? '' },
            targetAccount: { id: transfer.targetAccount?.id ?? 0, name: transfer.targetAccount?.name ?? '' },
            otherTransfers: otherTransfers,
            receipt: receiptDto,
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
            isInternal: transfer.originAccount.userId === transfer.targetAccount?.userId,
        };
    }

    private toTransferDTO(transfer: Transfer): TransferDTO {
        const transferType = transfer.originAccount.userId === transfer.targetAccount?.userId ? TransferType.INTERNAL.value : transfer.type;
        return {
            id: transfer.id,
            description: transfer.description,
            amount: transfer.amount,
            currency: transfer.currency.symbol,
            type: transferType,
            categoryId: transfer.category?.id,
            categoryName: transfer.category?.name,
            contractorId: transfer.contractor?.id ?? null,
            contractorName: transfer.contractor?.name ?? null,
            accountId: transfer.originAccountId,
            accountName: transfer.originAccount.name,
            date: transfer.date,
            receiptId: transfer.receiptId ?? null,
            isFlagged: transfer.isFlagged,
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

    @Post('createAdvanced')
    public async createTransfersFromAdvancedObject(@RequestingUser() user: User, @Body() requestBody: CreateMultipleTransfersDTO): Promise<BaseResponseDTO> {
        const transferEntities: Transfer[] = [];
        const items = await this.itemsService.getByIds(requestBody.items.map((item) => item.itemId));
        const contractor = requestBody.contractorId !== null ? await this.contractorDao.getById(requestBody.contractorId) : null;
        const account = await this.accountDao.getById(requestBody.accountId);

        // Create transfers from items
        const itemCategoriesIds = [...new Set(items.map((i) => i.categoryId))];
        for (const categoryId of itemCategoriesIds) {
            const itemsForCategory = items.filter((item) => item.categoryId === categoryId);

            const requestedItemsForCategory = itemsForCategory.map((item) => {
                const mappedItem = requestBody.items.find((requestedItem) => requestedItem.itemId === item.id);
                if (mappedItem === undefined) {
                    throw new NotFoundException();
                }
                return mappedItem;
            });

            const category = await this.categoryDao.getById(categoryId);

            const entity = new Transfer();
            entity.amount = requestedItemsForCategory.map((i) => i.calculatedPrice).reduce((a, b) => a + b, 0); //requestBody.amount;
            entity.currency = account.currency;
            entity.date = requestBody.date;
            entity.categoryId = category.id;
            entity.type = category.type;
            entity.contractorId = contractor?.id ?? null;

            entity.ownerUserId = user.id;
            entity.originAccountId = account.id;
            entity.targetAccountId = 17; // TODO: Fix this

            entity.receiptId = requestBody.receiptId ?? null;

            entity.isEthereal = true;

            await this.transfersService.saveTransfer(entity);

            entity.transferItems = [];
            for (const item of requestedItemsForCategory) {
                const transferItem = new TransferItem();
                transferItem.transferId = entity.id;
                transferItem.itemId = item.itemId;
                transferItem.quantity = item.quantity;
                transferItem.unitPrice = item.unitPrice;
                transferItem.totalSetDiscount = item.totalSetDiscount;
                entity.transferItems.push(transferItem);
            }

            transferEntities.push(entity);
        }

        const newTransferIds: number[] = [];
        for (const entity of transferEntities) {
            const inserted = await this.transfersService.saveTransfer(entity);
            newTransferIds.push(inserted.id);
        }

        return { insertedIds: newTransferIds };
    }

    @Post('save')
    public async saveTransferObject(@RequestingUser() user: User, @Body() transfer: CreateEditTransferModelDTO): Promise<BaseResponseDTO> {
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

        entity.description = transfer.description === undefined ? category?.name : transfer.description.trim();
        entity.amount = transfer.amount;
        entity.currency = account.currency;
        entity.date = transfer.date;
        entity.category = category;
        entity.categoryId = category.id;
        entity.type = category.type;

        if (entity.ownerUserId === undefined) {
            entity.ownerUser = user;
            entity.ownerUserId = user.id;
        }

        entity.originAccount = account;
        entity.originAccountId = account.id;

        entity.contractor = contractor;
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
        await this.transferItemsService.removeTransferItemsForTransferId(inserted.id);

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
        entity.accountingDate = target.accountingDate;
        entity.originAccountId = target.originAccountId;

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
        refundTransferEntity.accountingDate = refundDate;
        refundTransferEntity.originAccountId = transfer.targetAccountId ?? 0;
        refundTransferEntity.targetAccountId = transfer.originAccountId;
        refundTransferEntity.metadata.refundTargetId = refundTargetId;
        refundTransferEntity.contractor = transfer.contractor;
        refundTransferEntity.receipt = transfer.receipt;
        refundTransferEntity.ownerUser = transfer.ownerUser;

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
        transfer.accountingDate = null;

        const transferItems = transfer.transferItems;
        transfer.transferItems = [];

        const inserted = await this.transferDao.save(transfer);

        transferItems.forEach(async (transferItem) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (transferItem as any).id = undefined;
            transferItem.transferId = inserted.id;
            await this.transferItemsService.save(transferItem);
        });

        return { insertedId: inserted.id };
    }

    @Delete(':id')
    public async removeTransferObject(@Param('id') id: number) {
        // TODO: On remove delete refundedBy metadata from target
        //const refundTransfer = transfer.metadata.refundedBy ? await this.transferDao.getById(Number(transfer.metadata.refundedBy)) : undefined;
        return (await this.transferDao.deleteById(id)).affected == 1;
    }
}
