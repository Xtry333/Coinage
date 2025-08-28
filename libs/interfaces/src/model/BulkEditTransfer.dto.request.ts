import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class BulkEditTransferDTO {
    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    public transferIds!: number[];

    @IsOptional()
    @IsString()
    public description?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    public categoryId?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    public contractorId?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    public accountId?: number;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    public date?: Date;
}

export class BulkDeleteTransferDTO {
    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    public transferIds!: number[];
}
