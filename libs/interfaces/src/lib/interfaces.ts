export interface Message {
    message: string;
    millis: number;
}

export interface TransferDTO {
    id: number;
    description: string;
    contractor?: string;
    amount: number;
    type: TransferTypeEnum;
    category: string;
    categoryId: number;
    date: string;
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
    receipt?: ReceiptDTO;
}

export enum TransferTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
}

export class TransferType {
    public static readonly INCOME = new TransferType('Income', TransferTypeEnum.INCOME, '+');
    public static readonly OUTCOME = new TransferType('Expense', TransferTypeEnum.OUTCOME, '−');

    constructor(public readonly displayName: string, public readonly value: TransferTypeEnum, public readonly symbol: string) {}
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
    date?: string;
    amount: number;
    contractor?: string;
    transferIds: number[];
}
