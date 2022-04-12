import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { TransferTypeEnum } from '../model/TransferDetails.dto.response';
import { Type } from 'class-transformer';

export class FilteredTransfersDTO {
    @Type(() => TransferDTO) transfers!: TransferDTO[];

    totalCount!: number;
}

export class TransferDTO {
    @IsNumber() id!: number;
    @IsString() description!: string;
    @IsNumber() amount!: number;
    @IsEnum(TransferTypeEnum) type!: TransferTypeEnum;
    @IsNumber() categoryId!: number;
    @IsString() categoryName!: string;
    @IsNumber() @IsOptional() contractorId!: number | null;
    @IsString() @IsOptional() contractorName!: string | null;
    @IsNumber() accountId!: number;
    @IsString() accountName!: string;
    @IsNumber() receiptId!: number | null;
    @Type(() => Date) date!: Date;
}
