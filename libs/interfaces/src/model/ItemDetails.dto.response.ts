import { Type } from 'class-transformer';

export class ItemDetailsDTO {
    public id!: number;
    public brand!: string | null;
    public itemName!: string;
    public categoryId!: number | null;
    public categoryName!: string | null;
    @Type(() => ItemContainer) public container!: ItemContainer | null;
    @Type(() => Date) public createdDate!: Date;
    @Type(() => Date) public editedDate!: Date;
    @Type(() => TransferWithItemDetailsDTO) public transfersWithItems!: TransferWithItemDetailsDTO[];
}

export class TransferWithItemDetailsDTO {
    public transferId!: number;
    public transferName!: string;
    public transferContractorId!: number | null;
    public transferContractorName!: string | null;
    public accountId!: number;
    public accountName!: string;
    public receiptId!: number | null;
    public quantity!: number;
    public unitPrice!: number;
    @Type(() => Date) public date!: Date;
}

export class ItemContainer {
    public size!: number;
    public unit!: string;
}
