import { Type } from 'class-transformer';

export class GlobalSearchItemResult {
    public id: number;
    public name: string;
    public brand?: string | null;
    public categoryName?: string | null;

    public constructor(id: number, name: string, brand?: string | null, categoryName?: string | null) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.categoryName = categoryName;
    }
}

export class GlobalSearchTransferResult {
    public id: number;
    public description: string;
    public amount: number;
    public currencySymbol: string;
    
    @Type(() => Date)
    public date: Date;
    
    public contractorName?: string | null;
    public categoryName: string;

    public constructor(
        id: number,
        description: string,
        amount: number,
        currencySymbol: string,
        date: Date,
        categoryName: string,
        contractorName?: string | null,
    ) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.currencySymbol = currencySymbol;
        this.date = date;
        this.contractorName = contractorName;
        this.categoryName = categoryName;
    }
}

export class GlobalSearchResponse {
    @Type(() => GlobalSearchItemResult)
    public items: GlobalSearchItemResult[];

    @Type(() => GlobalSearchTransferResult)
    public transfers: GlobalSearchTransferResult[];

    public constructor(items: GlobalSearchItemResult[], transfers: GlobalSearchTransferResult[]) {
        this.items = items;
        this.transfers = transfers;
    }
}
