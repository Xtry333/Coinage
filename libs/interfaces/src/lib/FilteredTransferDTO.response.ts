import { TransferTypeEnum } from './interfaces';

export interface FilteredTransfersDTO {
    transfers: TransferDTO[];
    totalCount: number;
}

export interface TransferDTO {
    id: number;
    description: string;
    amount: number;
    type: TransferTypeEnum;
    categoryId: number;
    categoryName: string;
    contractorId: number | null;
    contractorName: string | null;
    accountId: number;
    accountName: string;
    receiptId: number | null;
    date: string;
}
