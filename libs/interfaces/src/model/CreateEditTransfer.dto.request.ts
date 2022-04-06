import { IsDate, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateEditTransferModelDTO {
    constructor(id: number | undefined, description: string, amount: number, categoryId: number, contractorId: number | null, accountId: number, date: Date) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.categoryId = categoryId;
        this.contractorId = contractorId;
        this.accountId = accountId;
        this.date = date;
    }

    @IsOptional()
    @IsNumber()
    @Min(1)
    id?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    amount: number;

    @IsNumber()
    @Min(1)
    categoryId: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    contractorId: number | null;

    @IsNumber()
    @Min(1)
    accountId: number;

    @IsDate()
    @Type(() => Date)
    date: Date;
}
