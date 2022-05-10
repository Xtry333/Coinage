import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { TransferTypeEnum } from '../model/TransferDetails.dto.response';
import { Type } from 'class-transformer';

export class FilteredTransfersDTO {
    @Type(() => TransferDTO) public transfers!: TransferDTO[];

    public totalCount!: number;
}

export class TransferDTO {
    @IsNumber() public id!: number;
    @IsString() public description!: string;
    @IsNumber() public amount!: number;
    @IsEnum(TransferTypeEnum) public type!: TransferTypeEnum;
    @IsNumber() public categoryId!: number;
    @IsString() public categoryName!: string;
    @IsNumber() @IsOptional() public contractorId!: number | null;
    @IsString() @IsOptional() public contractorName!: string | null;
    @IsNumber() public accountId!: number;
    @IsString() public accountName!: string;
    @IsNumber() public receiptId!: number | null;
    @Type(() => Date) public date!: Date;
}
