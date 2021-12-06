import { TransferDTO } from './interfaces';

export interface ReceiptDetailsDTO {
    id: number;
    description?: string;
    amount: number;
    totalAmount: number;
    totalTransferred: number;
    contractor?: {
        id: number;
        name: string;
    };
    date?: string;
    nextTransferDate?: string;
    allTransfers: TransferDTO[];
}