import { TransferDTO } from './FilteredTransferDTO.response';

export interface ReceiptDetailsDTO {
    id: number;
    description?: string;
    amount: number | null;
    totalAmount: number;
    totalTransferred: number;
    contractorId?: number | null;
    contractorName?: string | null;
    date?: Date | null;
    nextTransferDate?: Date;
    allTransfers: TransferDTO[];
}
