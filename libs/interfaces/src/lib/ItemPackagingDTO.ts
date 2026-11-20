export interface ItemPackagingInput {
    name?: string | null;
    containedPackagingId?: number | null;
    containedCount?: number | null;
    containerId: number | null;
    weight: number | null;
    weightUnit: string | null;
    volume: number | null;
    volumeUnit: string | null;
    itemCount: number | null;
    barcode: string | null;
    isPreferred?: boolean;
}

export interface ItemPackagingDTO extends ItemPackagingInput {
    id: number;
    itemId: number;
    containerName: string | null;
    isPreferred: boolean;
    isArchived: boolean;
    containedPackagingName?: string | null;
    nestingDepth?: number;
}

export type PackagingContents = Pick<ItemPackagingInput, 'weight' | 'weightUnit' | 'volume' | 'volumeUnit' | 'itemCount'>;

/** Leaf measurements are stored; outer-package totals are always derived from the selected version. */
export function calculatePackagingContents(
    packaging: ItemPackagingInput,
    variants: ReadonlyMap<number, ItemPackagingInput>,
    path: ReadonlySet<number> = new Set(),
): PackagingContents {
    const id = packaging.containedPackagingId;
    if (id == null) {
        return {
            weight: packaging.weight,
            weightUnit: packaging.weightUnit,
            volume: packaging.volume,
            volumeUnit: packaging.volumeUnit,
            itemCount: packaging.itemCount,
        };
    }
    if (path.has(id)) throw new Error('Packaging cannot contain itself or form a cycle.');
    if (path.size >= 31) throw new Error('Packaging nesting cannot exceed 32 levels.');
    const count = packaging.containedCount;
    if (!Number.isSafeInteger(count) || count == null || count <= 0 || count > 2147483647) throw new Error('Contained count must be a positive integer.');
    const child = variants.get(id);
    if (!child) throw new Error('Contained packaging must belong to the same product.');
    const contents = calculatePackagingContents(child, variants, new Set([...path, id]));
    const weight = contents.weight == null ? null : contents.weight * count;
    const volume = contents.volume == null ? null : contents.volume * count;
    const itemCount = (contents.itemCount ?? 1) * count;
    if (
        (weight != null && (!Number.isFinite(weight) || weight <= 0)) ||
        (volume != null && (!Number.isFinite(volume) || volume <= 0)) ||
        !Number.isSafeInteger(itemCount) ||
        itemCount <= 0
    ) {
        throw new Error('Calculated package contents are too large.');
    }
    return { weight, weightUnit: contents.weightUnit, volume, volumeUnit: contents.volumeUnit, itemCount };
}

export function packagingLabel(packaging: ItemPackagingInput & { containerName?: string | null; containedPackagingName?: string | null }): string {
    return (
        [
            packaging.name || packaging.containerName,
            packaging.containedPackagingId != null
                ? `${packaging.containedCount} × ${packaging.containedPackagingName || `package #${packaging.containedPackagingId}`}`
                : null,
            packaging.weight != null ? `${packaging.weight} ${packaging.weightUnit ?? ''}`.trim() : null,
            packaging.volume != null ? `${packaging.volume} ${packaging.volumeUnit ?? ''}`.trim() : null,
            packaging.itemCount != null && packaging.containedPackagingId == null ? `${packaging.itemCount} per pack` : null,
        ]
            .filter(Boolean)
            .join(' · ') || 'Unspecified packaging'
    );
}

export function packagingPerItemLabel(packaging: ItemPackagingInput): string {
    const count = packaging.itemCount;
    if (count == null || !Number.isSafeInteger(count) || count <= 1) return '';
    return [
        [packaging.weight, packaging.weightUnit],
        [packaging.volume, packaging.volumeUnit],
    ]
        .flatMap(([value, unit]) =>
            typeof value === 'number' && Number.isFinite(value) && value > 0 && unit ? [`${Number((value / count).toPrecision(6))} ${unit}`] : [],
        )
        .join(' · ');
}
