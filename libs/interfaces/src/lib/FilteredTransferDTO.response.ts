import { TransferTypeEnum } from './interfaces';

export interface FilteredTransfersDTO {
    transfers: TransferDTO[];
    totalCount: number;
}

export interface TransferDTO {
    id: number;
    description: string;
    contractor?: string;
    amount: number;
    type: TransferTypeEnum;
    category: string;
    categoryId: number;
    account: string;
    accountId: number;
    receiptId?: number;
    date: string;
}
