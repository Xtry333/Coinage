import { TransferTypeEnum } from './interfaces';
import { Type } from 'class-transformer';

export class FilteredTransfersDTO {
    @Type(() => TransferDTO) transfers!: TransferDTO[];

    totalCount!: number;
}

export class TransferDTO {
    id!: number;
    description!: string;
    amount!: number;
    type!: TransferTypeEnum;
    categoryId!: number;
    categoryName!: string;
    contractorId!: number | null;
    contractorName!: string | null;
    accountId!: number;
    accountName!: string;
    receiptId!: number | null;

    @Type(() => Date) date!: Date;
}
