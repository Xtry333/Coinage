import { AccountDTO, CategoryPathDTO, ReceiptDTO } from '../lib/interfaces';

import { TransferDTO } from '../lib/FilteredTransferDTO.response';
import { Type } from 'class-transformer';

export class TransferItemDTO {
    // public constructor(transferItem: TransferItemDTO) {
    //     this.id = transferItem.id;
    //     this.itemName = transferItem.itemName;
    //     this.unitPrice = transferItem.unitPrice;
    //     this.amount = transferItem.amount;
    //     this.unit = transferItem.unit;
    // }

    public id!: number;
    public itemName!: string;
    public unit!: string;
    public amount!: number;
    public unitPrice!: number;
}

export class TransferDetailsDTO {
    public id!: number;
    public description!: string;
    public amount!: number;
    public type!: TransferTypeEnum;
    public account!: AccountDTO;
    public targetAccount!: AccountDTO;
    public categoryPath!: CategoryPathDTO[];
    public categoryId!: number;
    public contractor?: string;
    public contractorId?: number;
    @Type(() => Date) public date!: Date;
    @Type(() => Date) public accountingDate!: Date | null;
    @Type(() => Date) public createdDate!: Date;
    @Type(() => Date) public editedDate!: Date;
    @Type(() => TransferDTO) public otherTransfers!: TransferDTO[];
    @Type(() => TransferItemDTO) public items!: TransferItemDTO[];
    public receipt!: ReceiptDTO | null;
    public refundedBy?: number;
    public refundedOn?: string;
    public isPlanned!: boolean;
    public isRefundable!: boolean;
    public isInternal!: boolean;
    public isEthereal!: boolean;
}

export enum TransferTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
    INTERNAL = 'INTERNAL',
}

export class TransferType {
    public static readonly INCOME = new TransferType('Income', TransferTypeEnum.INCOME, '+', 1);
    public static readonly OUTCOME = new TransferType('Expense', TransferTypeEnum.OUTCOME, '−', -1);
    public static readonly INTERNAL = new TransferType('Internal', TransferTypeEnum.INTERNAL, '~', 1);

    public constructor(
        public readonly displayName: string,
        public readonly value: TransferTypeEnum,
        public readonly symbol: string,
        public readonly mathSymbol: number,
    ) {}
}
