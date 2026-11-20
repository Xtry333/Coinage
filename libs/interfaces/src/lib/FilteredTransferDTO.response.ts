import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { EffectiveTagDTO } from './TagDTO.response';
import { TransferTypeEnum } from '../model/TransferDetails.dto.response';

export class FilteredTransfersDTO {
    @Type(() => TransferDTO) public transfers!: TransferDTO[];

    public totalCount!: number;
}

export class TransferDTO {
    @IsNumber() public id!: number;
    @IsString() public description!: string;
    @IsNumber() public amount!: number;
    @IsString() public currency!: string;
    @IsEnum(TransferTypeEnum) public type!: TransferTypeEnum;
    @IsNumber() public categoryId!: number;
    @IsString() public categoryName!: string;
    @IsNumber() @IsOptional() public contractorId!: number | null;
    @IsString() @IsOptional() public contractorName!: string | null;
    @IsNumber() public accountId!: number;
    @IsString() public accountName!: string;
    @IsNumber() public receiptId!: number | null;
    @IsBoolean() public isFlagged!: boolean;
    public tags!: EffectiveTagDTO[];
    @Type(() => Date) public date!: Date;
}
