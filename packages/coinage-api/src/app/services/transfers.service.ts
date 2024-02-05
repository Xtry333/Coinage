import { Injectable } from '@nestjs/common';

import { GetFilteredTransfersRequest, TransferDTO, TransferType } from '@coinage-app/interfaces';

import { CategoryDao } from '../daos/category.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Transfer } from '../entities/Transfer.entity';

@Injectable()
export class TransfersService {
    public constructor(private readonly transferDao: TransferDao, private readonly categoryDao: CategoryDao) {}

    public async getAllFilteredPagedDTO(filter: GetFilteredTransfersRequest): Promise<TransferDTO[]> {
        return (await this.transferDao.getAllFilteredPaged(filter)).map((t) => this.toTransferDTO(t));
    }

    public getAllFilteredCount(filter: GetFilteredTransfersRequest): Promise<number> {
        return this.transferDao.getAllFilteredCount(filter);
    }

    public async getRecentTransfersForUserDTO(userId: number, recentCount: number): Promise<TransferDTO[]> {
        return (await this.transferDao.getRecentlyEditedTransfersForUser(userId, recentCount)).map((t) => this.toTransferDTO(t));
    }

    public async saveTransfer(transfer: Transfer): Promise<Transfer> {
        const category = await this.categoryDao.getById(transfer.categoryId ?? transfer.category.id);
        if (category === null) {
            throw new Error('Category not found');
        }

        if (!transfer.description) {
            transfer.description = category.name;
        }

        return this.transferDao.save(transfer);
    }

    private toTransferDTO(transfer: Transfer): TransferDTO {
        return {
            id: transfer.id,
            description: transfer.description,
            amount: transfer.amount,
            currency: transfer.currency.symbol,
            type: this.getTransferType(transfer).value,
            categoryId: transfer.category?.id,
            categoryName: transfer.category?.name,
            contractorId: transfer.contractor?.id ?? null,
            contractorName: transfer.contractor?.name ?? null,
            accountId: transfer.originAccountId,
            accountName: `${transfer.originAccount.name} [${transfer.currency.symbol}]`,
            date: transfer.date,
            receiptId: transfer.receiptId ?? null,
            isFlagged: transfer.isFlagged,
        };
    }

    private getTransferType(transfer: Transfer): TransferType {
        if (transfer.originAccount.userId === transfer.targetAccount?.userId) {
            return TransferType.INTERNAL;
        }
        if (transfer.originAccount.userId === transfer.ownerUserId) {
            return TransferType.OUTCOME;
        }
        return TransferType.INCOME;
    }
}
