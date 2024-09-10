import { Type } from 'class-transformer';
import { IsDate, IsNotIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ExistingItem {
    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public itemId: number;

    @IsNumber()
    @IsNotIn([NaN])
    public quantity: number;

    @IsNumber()
    @IsNotIn([NaN])
    public unitPrice: number;

    @IsNumber()
    @IsNotIn([NaN])
    public totalSetDiscount: number;

    public constructor(itemId: number, quantity: number, unitPrice: number, totalSetDiscount: number) {
        this.itemId = itemId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalSetDiscount = totalSetDiscount;
    }

    public get calculatedPrice(): number {
        return this.quantity * this.unitPrice - this.totalSetDiscount;
    }
}

export class FakeItem {
    @IsNumber()
    @IsNotIn([NaN])
    public quantity: number;

    @IsNumber()
    @IsNotIn([NaN])
    public unitPrice: number;

    @IsNumber()
    @IsNotIn([NaN])
    public totalSetDiscount: number;

    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public categoryId: number;

    public constructor(quantity: number, unitPrice: number, totalSetDiscount: number, categoryId: number) {
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalSetDiscount = totalSetDiscount;
        this.categoryId = categoryId;
    }

    public get calculatedPrice(): number {
        return this.quantity * this.unitPrice - this.totalSetDiscount;
    }
}

export class CreateMultipleTransfersDTO {
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
    public mainCategoryId: number;

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

    @Type(() => ExistingItem)
    public items: ExistingItem[];

    public constructor(
        description: string,
        amount: number,
        categoryId: number,
        contractorId: number | null,
        accountId: number,
        date: Date,
        receiptId: number | null,
        items: ExistingItem[] | undefined,
    ) {
        this.description = description;
        this.amount = amount;
        this.mainCategoryId = categoryId;
        this.contractorId = contractorId;
        this.accountId = accountId;
        this.date = date;
        this.receiptId = receiptId;
        this.items = items ?? [];
    }
}
