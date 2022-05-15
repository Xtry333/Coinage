import { IsDate, IsNotIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ShoppingListItem {
    public constructor(public id: number | undefined, public name: string, public amount: number, public price: number) {}
}

export class CreateEditTransferModelDTO {
    public constructor(
        id: number | undefined,
        description: string,
        amount: number,
        categoryId: number,
        contractorId: number | null,
        accountId: number,
        date: Date,
        receiptId: number | null,
        items: ShoppingListItem[] | undefined
    ) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.categoryId = categoryId;
        this.contractorId = contractorId;
        this.accountId = accountId;
        this.date = date;
        this.receiptId = receiptId;
        this.items = items ?? [];
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

    @Type(() => ShoppingListItem)
    public items: ShoppingListItem[];
}
