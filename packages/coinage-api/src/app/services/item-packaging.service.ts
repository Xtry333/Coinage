import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { calculatePackagingContents, ItemPackagingDTO, ItemPackagingInput, ItemPackagingSaveInput } from '@app/interfaces';

import { Container } from '../entities/Container.entity';
import { Item } from '../entities/Item.entity';
import { ItemPackaging } from '../entities/ItemPackaging.entity';
import { TransferItem } from '../entities/TransferItem.entity';

export function toPackagingDTO(packaging: ItemPackaging): ItemPackagingDTO {
    const contents = packaging.contents ?? packaging;
    return {
        id: packaging.id,
        itemId: packaging.itemId,
        containerId: packaging.containerId,
        containerName: packaging.container?.name ?? null,
        name: packaging.name ?? packaging.container?.name ?? null,
        containedPackagingId: packaging.containedPackagingId ?? null,
        containedCount: packaging.containedCount ?? null,
        containedPackagingName: packaging.contents?.containedName ?? null,
        nestingDepth: packaging.contents?.nestingDepth ?? 1,
        weight: contents.weight,
        weightUnit: contents.weightUnit,
        volume: contents.volume,
        volumeUnit: contents.volumeUnit,
        itemCount: contents.itemCount,
        barcode: packaging.barcode,
        isPreferred: packaging.isPreferred,
        isArchived: packaging.isArchived,
    };
}

export function validatePackaging(data: ItemPackagingInput): void {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new BadRequestException('Invalid packaging.');
    if (data.containerId != null && (!Number.isSafeInteger(data.containerId) || data.containerId <= 0)) {
        throw new BadRequestException('Invalid container.');
    }
    if (data.name !== undefined && (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 64)) {
        throw new BadRequestException('Packaging name must be 1–64 characters.');
    }
    if (data.containedPackagingId != null) {
        if (
            !Number.isSafeInteger(data.containedPackagingId) ||
            data.containedPackagingId <= 0 ||
            !Number.isSafeInteger(data.containedCount) ||
            data.containedCount == null ||
            data.containedCount <= 0 ||
            data.containedCount > 2147483647
        ) {
            throw new BadRequestException('Select a contained package and a positive integer count.');
        }
        if ([data.weight, data.weightUnit, data.volume, data.volumeUnit, data.itemCount].some((value) => value != null)) {
            throw new BadRequestException('Outer-package contents are calculated from the contained package; do not enter totals.');
        }
    } else if (data.containedCount != null) {
        throw new BadRequestException('A contained count requires a contained package.');
    }
    const measurements: [number | null, string | null, string[]][] = [
        [data.weight, data.weightUnit, ['g', 'kg']],
        [data.volume, data.volumeUnit, ['ml', 'cl', 'l']],
    ];
    for (const [value, unit, allowed] of measurements) {
        if (value == null && unit == null) continue;
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || !unit || !allowed.includes(unit)) {
            throw new BadRequestException('Sizes must be positive and have a compatible unit.');
        }
    }
    if (data.itemCount != null && (!Number.isSafeInteger(data.itemCount) || data.itemCount <= 0 || data.itemCount > 2147483647)) {
        throw new BadRequestException('Items per package must be an integer between 1 and 2147483647.');
    }
    if (data.barcode != null && (typeof data.barcode !== 'string' || data.barcode.length > 64)) {
        throw new BadRequestException('Barcode must be at most 64 characters.');
    }
    if (data.isPreferred !== undefined && typeof data.isPreferred !== 'boolean') throw new BadRequestException('Invalid preferred flag.');
    if (data.containerId == null && data.weight == null && data.volume == null && data.itemCount == null && data.containedPackagingId == null && !data.name) {
        throw new BadRequestException('Specify a container, net contents, or pack count.');
    }
}

@Injectable()
export class ItemPackagingService {
    public constructor(private readonly dataSource: DataSource) {}

    public async list(itemId: number): Promise<ItemPackagingDTO[]> {
        if (!(await this.dataSource.getRepository(Item).exists({ where: { id: itemId }, loadEagerRelations: false })))
            throw new NotFoundException('Item not found.');
        const variants = await this.dataSource.getRepository(ItemPackaging).find({
            where: { itemId },
            order: { isArchived: 'ASC', isPreferred: 'DESC', id: 'ASC' },
        });
        return variants.map(toPackagingDTO);
    }

    private async lockItem(manager: EntityManager, itemId: number): Promise<void> {
        const item = await manager.getRepository(Item).findOne({ where: { id: itemId }, lock: { mode: 'pessimistic_write' }, loadEagerRelations: false });
        if (!item) throw new NotFoundException('Item not found.');
    }

    public async save(itemId: number, data: ItemPackagingSaveInput, replacedId?: number): Promise<ItemPackagingDTO> {
        validatePackaging(data);
        if (
            (data.correctExistingPackaging !== undefined && typeof data.correctExistingPackaging !== 'boolean') ||
            (data.acknowledgeHistoricalImpact !== undefined && typeof data.acknowledgeHistoricalImpact !== 'boolean')
        ) {
            throw new BadRequestException('Invalid historical correction option.');
        }
        if (data.correctExistingPackaging && data.acknowledgeHistoricalImpact !== true) {
            throw new BadRequestException('Acknowledge the historical impact before correcting existing packaging.');
        }
        if (data.correctExistingPackaging && !replacedId) throw new BadRequestException('Select an existing package to correct.');
        return this.dataSource.transaction(async (manager) => {
            await this.lockItem(manager, itemId);
            const repository = manager.getRepository(ItemPackaging);
            const previous = replacedId ? await repository.findOneBy({ id: replacedId, itemId }) : null;
            if (replacedId && (!previous || (previous.isArchived && !data.correctExistingPackaging))) {
                throw new NotFoundException('Packaging variant not found or archived.');
            }
            const variants = data.containedPackagingId != null || data.correctExistingPackaging ? await repository.find({ where: { itemId } }) : [];
            const byId = new Map<number, ItemPackagingInput & { id: number }>(variants.map((p) => [p.id, p]));
            let derived: ReturnType<typeof calculatePackagingContents> | undefined;
            let containedName: string | null = null;
            let nestingDepth = 1;
            if (data.containedPackagingId != null) {
                const child = byId.get(data.containedPackagingId);
                if (!child) throw new BadRequestException('Contained packaging must belong to the same product.');
                const path = new Set<number>();
                let current: (ItemPackagingInput & { id: number }) | undefined = child;
                while (current) {
                    if (current.id === replacedId || path.has(current.id)) throw new BadRequestException('Packaging cannot contain itself or form a cycle.');
                    path.add(current.id);
                    if (path.size >= 32) throw new BadRequestException('Packaging nesting cannot exceed 32 levels.');
                    current = current.containedPackagingId != null ? byId.get(current.containedPackagingId) : undefined;
                }
                nestingDepth = path.size + 1;
                try {
                    derived = calculatePackagingContents(data, byId);
                } catch (error) {
                    throw new BadRequestException(error instanceof Error ? error.message : 'Invalid contained packaging.');
                }
                containedName = child.name ?? null;
            }
            if (data.correctExistingPackaging && previous) {
                byId.set(previous.id, { ...data, id: previous.id });
                try {
                    // A correction also changes every outer package using this version.
                    for (const variant of byId.values()) calculatePackagingContents(variant, byId);
                } catch (error) {
                    throw new BadRequestException(error instanceof Error ? error.message : 'Invalid contained packaging.');
                }
            }
            const container = data.containerId != null ? await manager.getRepository(Container).findOneBy({ id: data.containerId }) : null;
            if (data.containerId != null && !container) throw new NotFoundException('Container not found.');
            const preferred = previous?.isArchived ? false : (data.isPreferred ?? previous?.isPreferred ?? false);
            // Preserve historical versions unless a correction has been explicitly acknowledged.
            if (previous && !data.correctExistingPackaging) await repository.update(previous.id, { isArchived: true, isPreferred: false });
            if (preferred) await repository.update({ itemId, isPreferred: true }, { isPreferred: false });
            const saved = await repository.save(
                repository.create({
                    ...(data.correctExistingPackaging && previous ? { id: previous.id } : {}),
                    itemId,
                    name: data.name?.trim() || previous?.name || container?.name?.trim() || 'Package',
                    containedPackagingId: data.containedPackagingId ?? null,
                    containedCount: data.containedCount ?? null,
                    containerId: container?.id ?? null,
                    container,
                    weight: data.weight ?? null,
                    weightUnit: data.weightUnit ?? null,
                    volume: data.volume ?? null,
                    volumeUnit: data.volumeUnit ?? null,
                    itemCount: data.itemCount ?? null,
                    barcode: data.barcode?.trim() || null,
                    isPreferred: preferred,
                    isArchived: data.correctExistingPackaging ? (previous?.isArchived ?? false) : false,
                }),
            );
            const dto = toPackagingDTO(saved);
            return derived ? { ...dto, ...derived, containedPackagingName: containedName, nestingDepth } : dto;
        });
    }

    public async setState(itemId: number, id: number, action: 'prefer' | 'archive'): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            await this.lockItem(manager, itemId);
            const repository = manager.getRepository(ItemPackaging);
            const variant = await repository.findOneBy({ id, itemId });
            if (!variant || variant.isArchived) throw new NotFoundException('Active packaging variant not found.');
            if (action === 'prefer') {
                await repository.update({ itemId, isPreferred: true }, { isPreferred: false });
                await repository.update(id, { isPreferred: true });
            } else {
                await repository.update(id, { isArchived: true, isPreferred: false });
            }
        });
    }

    // Older clients still send containerId only. Snapshot that legacy definition once per product.
    public async resolve(itemId: number, id: number | null | undefined, containerId: number | null, previous?: TransferItem): Promise<ItemPackaging | null> {
        if (id === null) return null;
        if (id !== undefined) {
            if (!Number.isSafeInteger(id) || id <= 0) throw new BadRequestException('Invalid packaging variant.');
            const packaging = await this.dataSource.getRepository(ItemPackaging).findOneBy({ id, itemId });
            if (!packaging) throw new BadRequestException('Packaging variant does not belong to this item.');
            return packaging;
        }
        if (previous?.packagingId && previous.itemId === itemId && previous.containerId === containerId) {
            return this.resolve(itemId, previous.packagingId, containerId);
        }
        if (containerId == null) return null;
        return this.dataSource.transaction(async (manager) => {
            await this.lockItem(manager, itemId);
            const container = await manager.getRepository(Container).findOneBy({ id: containerId });
            if (!container) throw new BadRequestException('Container not found.');
            const repository = manager.getRepository(ItemPackaging);
            const variants = await repository.find({ where: { itemId, containerId } });
            const match = variants.find(
                (p) =>
                    p.containedPackagingId == null &&
                    p.weight === container.weight &&
                    p.weightUnit === container.weightUnit &&
                    p.volume === container.volume &&
                    p.volumeUnit === container.volumeUnit &&
                    p.itemCount === container.itemCount,
            );
            if (match) return match;
            return repository.save(
                repository.create({
                    itemId,
                    name: container.name?.trim() || 'Package',
                    containedPackagingId: null,
                    containedCount: null,
                    containerId,
                    container,
                    weight: container.weight,
                    weightUnit: container.weightUnit,
                    volume: container.volume,
                    volumeUnit: container.volumeUnit,
                    itemCount: container.itemCount,
                    barcode: null,
                    isPreferred: false,
                    isArchived: false,
                }),
            );
        });
    }
}
