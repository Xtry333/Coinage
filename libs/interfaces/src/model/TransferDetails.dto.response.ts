import { AccountDTO, CategoryPathDTO, ReceiptDTO } from '../lib/interfaces';

import { TransferDTO } from '../lib/FilteredTransferDTO.response';
import { Type } from 'class-transformer';

export class TransferDetailsDTO {
    id!: number;
    description!: string;
    amount!: number;
    type!: TransferTypeEnum;
    account!: AccountDTO;
    categoryPath!: CategoryPathDTO[];
    categoryId!: number;
    contractor?: string;
    contractorId?: number;
    @Type(() => Date) date!: Date;
    @Type(() => Date) createdDate!: Date;
    @Type(() => Date) editedDate!: Date;
    otherTransfers!: TransferDTO[];
    receipt!: ReceiptDTO | null;
    refundedBy?: number;
    refundedOn?: string;
    isPlanned!: boolean;
    isRefundable!: boolean;
}

export enum TransferTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
}

export class TransferType {
    public static readonly INCOME = new TransferType('Income', TransferTypeEnum.INCOME, '+', 1);
    public static readonly OUTCOME = new TransferType('Expense', TransferTypeEnum.OUTCOME, '−', -1);

    constructor(
        public readonly displayName: string,
        public readonly value: TransferTypeEnum,
        public readonly symbol: string,
        public readonly mathSymbol: number
    ) {}
}
