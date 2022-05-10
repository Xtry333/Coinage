import { IsDate, IsNotIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEditTransferModelDTO {
    public constructor(
        id: number | undefined,
        description: string,
        amount: number,
        categoryId: number,
        contractorId: number | null,
        accountId: number,
        date: Date,
        receiptId: number | null
    ) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.categoryId = categoryId;
        this.contractorId = contractorId;
        this.accountId = accountId;
        this.date = date;
        this.receiptId = receiptId;
    }

    @IsOptional()
    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public id?: number;

    @IsOptional()
    @IsString()
    public description?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsNotIn([NaN])
    public amount: number;

    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public categoryId: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public contractorId: number | null;

    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public accountId: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public receiptId: number | null;

    @IsDate()
    @Type(() => Date)
    public date: Date;
}
