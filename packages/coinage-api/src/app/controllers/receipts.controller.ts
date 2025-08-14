import { ReceiptDetailsDTO, TransferDTO, TransferType } from '@app/interfaces';
import { Controller, Get, Param } from '@nestjs/common';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Transfer } from '../entities/Transfer.entity';
import { DateParserService } from '../services/date-parser.service';

@Controller('receipt(s)?')
export class ReceiptsController {
    public constructor(
        private readonly transferDao: TransferDao,
        private readonly receiptDao: ReceiptDao,
        private readonly categoryDao: CategoryDao,
        private readonly contractorDao: ContractorDao,
        private readonly accountDao: AccountDao,
        private readonly dateParserService: DateParserService,
    ) {}

    @Get(':id/details')
    public async getReceiptDetails(@Param('id') id: number): Promise<ReceiptDetailsDTO> {
        if (!id) {
            throw new Error('Invalid ID provided.');
        }
        const receipt = await this.receiptDao.getById(id);

        return {
            id: receipt.id,
            date: receipt.date,
            nextTransferDate: this.getNextTransferDate(receipt.transfers),
            description: receipt.description,
            amount: Number(receipt.amount),
            totalAmount: this.calculateTotalAmount(receipt.transfers, true),
            totalTransferred: this.calculateTotalAmount(receipt.transfers, false),
            contractorId: receipt.contractor?.id ?? null,
            contractorName: receipt.contractor?.name ?? null,
            allTransfers: receipt.transfers.map(this.toTransferDTO),
        };
    }

    private calculateTotalAmount(transfers: Transfer[], withPlanned: boolean): number {
        return Math.abs(
            transfers
                ?.filter((t) => withPlanned || new Date(t.date) <= new Date())
                .reduce((amount, t) => amount + Number(t.amount) * TransferType[t.category.type].mathSymbol, 0),
        );
    }

    private toTransferDTO(transfer: Transfer): TransferDTO {
        return {
            id: transfer.id,
            date: transfer.date,
            description: transfer.description,
            amount: Number(transfer.amount),
            currency: transfer.currency.symbol,
            type: transfer.type,
            categoryId: transfer.category.id,
            categoryName: transfer.category.name,
            contractorId: transfer.contractorId ?? null,
            contractorName: transfer.contractor?.name ?? null,
            accountId: transfer.originAccount.id,
            accountName: transfer.originAccount.name,
            receiptId: transfer.receiptId ?? null,
            isFlagged: transfer.isFlagged,
        };
    }

    private getNextTransferDate(transfers: Transfer[]): Date | undefined {
        const todayStr = new Date().toISOString().substring(0, 10);
        const todayTransfersIndex = transfers.find((t) => t.date.getTime() > new Date().getTime());
        if (todayTransfersIndex) {
            return todayTransfersIndex.date;
        }
    }
}
