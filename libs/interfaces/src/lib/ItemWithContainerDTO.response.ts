import { Unit } from '@app/common-units';

export class ItemWithContainerDTO {
    public id!: number;
    public name!: string;
    public brand?: string | null;
    public categoryId!: number;
    public categoryName?: string | null;

    // Deprecated item-level container fields (marked for removal)
    /** @deprecated Use containerName, containerWeight, containerVolume instead */
    public containerSize?: number | null;
    /** @deprecated Use containerName, containerWeight, containerVolume instead */
    public containerSizeUnit?: string | null;

    // Container entity information
    public containerId?: number | null;
    public containerName?: string | null;
    public containerWeight?: number | null;
    public containerWeightUnit?: Unit | null;
    public containerVolume?: number | null;
    public containerVolumeUnit?: Unit | null;

    // Usage and pricing information
    public lastUsedDate?: Date | null;
    public lastUnitPrice?: number | null;
    public lastUnitPriceCurrency?: string | null;
    public transferItemId?: number | null;
}
