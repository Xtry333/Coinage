import { Controller, Get, Param } from '@nestjs/common';

import { ReceiptDetailsDTO, TransferDTO, TransferType } from '@coinage-app/interfaces';
import { TransferDao } from '../daos/transfer.dao';
import { CategoryDao } from '../daos/category.dao';
import { Transfer } from '../entities/Transfer.entity';
import { ContractorDao } from '../daos/contractor.dao';
import { AccountDao } from '../daos/account.dao';
import { DateParserService } from '../services/date-parser.service';
import { ReceiptDao } from '../daos/receipt.dao';
import { Contractor } from '../entities/Contractor.entity';

@Controller('receipt(s)?')
export class ReceiptsController {
    constructor(
        private readonly transferDao: TransferDao,
        private readonly receiptDao: ReceiptDao,
        private readonly categoryDao: CategoryDao,
        private readonly contractorDao: ContractorDao,
        private readonly accountDao: AccountDao,
        private readonly dateParserService: DateParserService
    ) {}

    @Get('details/:id')
    async getReceiptDetails(@Param('id') paramId: string): Promise<ReceiptDetailsDTO> {
        const id = parseInt(paramId);
        if (!id) {
            throw new Error('Invalid ID provided.');
        }
        const receipt = await this.receiptDao.getById(id);

        return {
            id: receipt.id,
            date: receipt.date,
            nextTransferDate: this.getNextTransferDate(await receipt.transfers),
            description: receipt.description,
            amount: Number(receipt.amount),
            totalAmount: this.calculateTotalAmount(await receipt.transfers, true),
            totalTransferred: this.calculateTotalAmount(await receipt.transfers, false),
            contractor: this.mapToContractor(receipt.contractor),
            allTransfers: (await receipt.transfers)
                .map(this.mapToTransfer)
                .sort((a, b) => a.date.localeCompare(b.date))
                .reverse(),
        };
    }

    private mapToContractor(contractor?: Contractor) {
        return contractor
            ? {
                  id: contractor.id,
                  name: contractor.name,
              }
            : undefined;
    }

    private calculateTotalAmount(transfers: Transfer[], withPlanned: boolean): number {
        return Math.abs(
            transfers
                ?.filter((t) => withPlanned || new Date(t.date) <= new Date())
                .reduce((amount, t) => amount + Number(t.amount) * TransferType[t.category.type].mathSymbol, 0)
        );
    }

    private mapToTransfer(transfer: Transfer): TransferDTO {
        return {
            id: transfer.id,
            date: transfer.date,
            description: transfer.description,
            amount: Number(transfer.amount),
            categoryId: transfer.category.id,
            category: transfer.category.name,
            contractor: transfer.contractor?.name,
            accountId: transfer.account.id,
            account: transfer.account.name,
            type: transfer.type,
        };
    }

    private getNextTransferDate(transfers: Transfer[]): string | undefined {
        const todayStr = new Date().toISOString().substring(0, 10);
        const todayTransfersIndex = transfers.find((t) => t.date.localeCompare(todayStr) > 0);
        if (todayTransfersIndex) {
            return todayTransfersIndex.date;
        }
    }
}
