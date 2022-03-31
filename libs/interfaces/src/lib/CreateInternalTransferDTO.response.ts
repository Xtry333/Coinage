import { Type } from 'class-transformer';

export class CreateInternalTransferDTO {
    description!: string;
    amount!: number;

    @Type(() => Date)
    date!: Date;
}
