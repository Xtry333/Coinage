import { TransferDTO } from './FilteredTransferDTO.response';
import { Type } from 'class-transformer';

export class ReceiptDetailsDTO {
    id!: number;
    description?: string | null;
    amount?: number | null;
    totalAmount!: number;
    totalTransferred!: number;
    contractorId?: number | null;
    contractorName?: string | null;
    date?: Date | null;
    nextTransferDate?: Date;
    @Type(() => TransferDTO) allTransfers!: TransferDTO[];
}
