import { GetFilteredTransfersRequest, TransferDTO } from '@coinage-app/interfaces';
import { Injectable } from '@nestjs/common';
import { CategoryDao } from '../daos/category.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Transfer } from '../entities/Transfer.entity';

@Injectable()
export class TransfersService {
    constructor(private readonly transferDao: TransferDao, private readonly categoryDao: CategoryDao) {}

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
        const category = await this.categoryDao.getById(transfer.categoryId);
        if (category == undefined) {
            throw new Error('Category not found');
        }

        if (transfer.description == undefined) {
            transfer.description = category.name;
        }

        return this.transferDao.save(transfer);
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
}
