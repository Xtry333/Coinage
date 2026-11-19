import { Type } from 'class-transformer';

import { TransferDTO } from './FilteredTransferDTO.response';
import { EffectiveTagDTO } from './TagDTO.response';

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
    tags!: EffectiveTagDTO[];
    @Type(() => TransferDTO) allTransfers!: TransferDTO[];
}
