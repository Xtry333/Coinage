import { TransferDTO } from './FilteredTransferDTO.response';

export interface Message {
    message: string;
    millis: number;
}

export interface AccountDTO {
    id: number;
    name: string;
}

export interface CategoryPathDTO {
    id: number;
    name: string;
}

export interface TransferDetailsDTO {
    id: number;
    description: string;
    amount: number;
    type: TransferTypeEnum;
    account: AccountDTO;
    categoryPath: CategoryPathDTO[];
    categoryId: number;
    contractor?: string;
    contractorId?: number;
    date: string;
    createdDate?: Date;
    editedDate: Date;
    otherTransfers: TransferDTO[];
    receipt: ReceiptDTO | null;
    refundedBy?: number;
    refundedOn?: string;
    isPlanned: boolean;
    isRefundable: boolean;
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

export interface TotalAmountPerMonthDTO {
    year: number;
    month: number;
    outcomes: number;
    incomes: number;
    transactionsCount: number;
}

export interface ReceiptDTO {
    id: number;
    description: string;
    date?: string | null;
    amount: number | null;
    contractor?: string;
    transferIds: number[];
}

export interface Range<T> {
    from: T;
    to: T;
}
