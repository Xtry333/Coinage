import { Type } from 'class-transformer';
import { Unit } from '@app/common-units';

export class ItemDetailsDTO {
    public id!: number;
    public brand!: string | null;
    public itemName!: string;
    public categoryId!: number | null;
    public categoryName!: string | null;
    /**
     * @deprecated Prefer transfer-level container fields on TransferWithItemDetailsDTO.
     * Kept for backward compatibility.
     */
    @Type(() => ItemContainer) public container!: ItemContainer | null;
    @Type(() => Date) public createdDate!: Date;
    @Type(() => Date) public editedDate!: Date;
    @Type(() => TransferWithItemDetailsDTO) public transfersWithItems!: TransferWithItemDetailsDTO[];
    @Type(() => AdvancedItemContainer) public itemContainers!: AdvancedItemContainer[];
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
    public containerName!: string | null;
    public containerWeight!: number | null;
    public containerWeightUnit!: Unit | null;
    public containerVolume!: number | null;
    public containerVolumeUnit!: Unit | null;
    @Type(() => Date) public date!: Date;
}

export class ItemContainer {
    /** @deprecated Prefer transfer-level container fields */
    public size?: number;
    /** @deprecated Prefer transfer-level container fields */
    public unit!: Unit | null;
}

export class AdvancedItemContainer {
    public id?: number;
    public name?: string | null;
    public weight?: number;
    public weightUnit?: Unit;
    public volume?: number;
    public volumeUnit?: Unit;
}
