import { Type } from 'class-transformer';
import { IsArray, IsDate, IsInt, IsNotIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

import { TagDTO } from '../lib/TagDTO.response';

export class ShoppingListItem {
    @IsOptional()
    @IsInt()
    @Min(1)
    public id: number | undefined;

    @IsNumber()
    @Min(0)
    public amount: number;

    @IsNumber()
    public price: number;

    @IsNumber()
    public totalPrice: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    public setDiscount: number | undefined;

    public constructor(
        id: number | undefined,
        public name: string,
        amount: number,
        price: number,
        totalPrice: number,
        setDiscount: number | undefined,
        public categoryId: number | null,
        public containerId?: number | null,
        public transferItemId?: number | null,
        public tags: TagDTO[] = [],
        public packagingId?: number | null,
    ) {
        this.id = id;
        this.amount = amount;
        this.price = price;
        this.totalPrice = totalPrice;
        this.setDiscount = setDiscount;
    }
}

export class GranularTransferItemChanges {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShoppingListItem)
    public addedItems: ShoppingListItem[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShoppingListItem)
    public editedItems: ShoppingListItem[];

    public constructor(
        addedItems: ShoppingListItem[],
        editedItems: ShoppingListItem[],
        public removedItemIds: number[],
    ) {
        this.addedItems = addedItems;
        this.editedItems = editedItems;
    }
}

export class GranularCreateEditTransferModelDTO {
    public constructor(
        id: number | undefined,
        description: string,
        amount: number,
        categoryId: number,
        contractorId: number | null,
        originAccountId: number,
        date: Date,
        receiptId: number | null,
        itemChanges: GranularTransferItemChanges,
        targetAccountId: number | null = null,
        tagIds?: number[],
    ) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.categoryId = categoryId;
        this.contractorId = contractorId;
        this.originAccountId = originAccountId;
        this.date = date;
        this.receiptId = receiptId;
        this.itemChanges = itemChanges;
        this.targetAccountId = targetAccountId;
        this.tagIds = tagIds;
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
    public originAccountId: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public receiptId: number | null;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public targetAccountId: number | null;

    @IsDate()
    @Type(() => Date)
    public date: Date;

    @Type(() => GranularTransferItemChanges)
    @ValidateNested()
    public itemChanges: GranularTransferItemChanges;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    public tagIds?: number[];
}

export class CreateEditTransferModelDTO {
    public constructor(
        id: number | undefined,
        description: string,
        amount: number,
        categoryId: number,
        contractorId: number | null,
        originAccountId: number,
        date: Date,
        receiptId: number | null,
        items: ShoppingListItem[] | undefined,
        targetAccountId: number | null = null,
        tagIds?: number[],
    ) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.categoryId = categoryId;
        this.contractorId = contractorId;
        this.originAccountId = originAccountId;
        this.date = date;
        this.receiptId = receiptId;
        this.items = items ?? [];
        this.targetAccountId = targetAccountId;
        this.tagIds = tagIds;
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
    public originAccountId: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public receiptId: number | null;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @IsNotIn([NaN])
    public targetAccountId: number | null;

    @IsDate()
    @Type(() => Date)
    public date: Date;

    @Type(() => ShoppingListItem)
    @IsArray()
    @ValidateNested({ each: true })
    public items: ShoppingListItem[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    public tagIds?: number[];
}
