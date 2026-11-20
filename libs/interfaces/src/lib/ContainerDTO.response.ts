export interface ContainerDTO {
    id: number;
    name: string | null;
    /** @deprecated Legacy contents. New product-specific sizes belong to ItemPackagingDTO. */
    weight: number | null;
    weightUnit: string | null;
    volume: number | null;
    volumeUnit: string | null;
    itemCount: number | null;
}

export interface CreateEditContainerDTO {
    id?: number;
    name?: string | null;
    weight?: number | null;
    weightUnit?: string | null;
    volume?: number | null;
    volumeUnit?: string | null;
    itemCount?: number | null;
}

export interface UpdateSharedContainerDTO extends CreateEditContainerDTO {
    /** Explicit global correction; only variants matching the previous full size are updated. */
    correctMatchingPackaging?: boolean;
    acknowledgeHistoricalImpact?: boolean;
}
