import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseResponseDTO, UpdateSharedContainerDTO } from '@app/interfaces';

import { Container } from '../entities/Container.entity';
import { ItemPackaging } from '../entities/ItemPackaging.entity';
import { validatePackaging } from './item-packaging.service';

@Injectable()
export class SharedContainersService {
    public constructor(private readonly source: DataSource) {}

    public async update(id: number, input: UpdateSharedContainerDTO): Promise<BaseResponseDTO> {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('Invalid container.');
        if (input.correctMatchingPackaging !== undefined && typeof input.correctMatchingPackaging !== 'boolean') {
            throw new BadRequestException('Invalid historical correction option.');
        }
        if (input.correctMatchingPackaging && input.acknowledgeHistoricalImpact !== true) {
            throw new BadRequestException('Acknowledge the historical impact before correcting shared sizes.');
        }

        return this.source.transaction(async (manager) => {
            const repository = manager.getRepository(Container);
            // Serialize shared-definition edits without blocking foreign-key references from new purchases.
            const entity = await repository.findOne({ where: { id }, lock: { mode: 'for_no_key_update' } });
            if (!entity) throw new NotFoundException('Container not found.');
            const previous = {
                weight: entity.weight,
                weightUnit: entity.weightUnit,
                volume: entity.volume,
                volumeUnit: entity.volumeUnit,
                itemCount: entity.itemCount,
            };
            const updated = {
                name: input.name !== undefined ? input.name : entity.name,
                weight: input.weight !== undefined ? input.weight : entity.weight,
                weightUnit: input.weightUnit !== undefined ? input.weightUnit : entity.weightUnit,
                volume: input.volume !== undefined ? input.volume : entity.volume,
                volumeUnit: input.volumeUnit !== undefined ? input.volumeUnit : entity.volumeUnit,
                itemCount: input.itemCount !== undefined ? input.itemCount : entity.itemCount,
            };
            if (updated.name != null && (typeof updated.name !== 'string' || updated.name.trim().length > 64)) {
                throw new BadRequestException('Container name must be at most 64 characters.');
            }
            validatePackaging({ ...updated, name: undefined, containerId: id, barcode: null });
            updated.name = updated.name?.trim() || null;
            await repository.save(Object.assign(entity, updated));

            let correctedCount = 0;
            const sizeChanged = (Object.keys(previous) as (keyof typeof previous)[]).some((key) => updated[key] !== previous[key]);
            if (input.correctMatchingPackaging && sizeChanged) {
                // Preserve independently defined sizes. Matching archived snapshots are deliberately included.
                const corrected = await manager
                    .createQueryBuilder()
                    .update(ItemPackaging)
                    .set({
                        weight: updated.weight,
                        weightUnit: updated.weightUnit,
                        volume: updated.volume,
                        volumeUnit: updated.volumeUnit,
                        itemCount: updated.itemCount,
                    })
                    .where('container_id = :containerId', { containerId: id })
                    .andWhere('contained_packaging_id IS NULL')
                    .andWhere('weight IS NOT DISTINCT FROM :oldWeight', { oldWeight: previous.weight })
                    .andWhere('weight_unit IS NOT DISTINCT FROM :oldWeightUnit', { oldWeightUnit: previous.weightUnit })
                    .andWhere('volume IS NOT DISTINCT FROM :oldVolume', { oldVolume: previous.volume })
                    .andWhere('volume_unit IS NOT DISTINCT FROM :oldVolumeUnit', { oldVolumeUnit: previous.volumeUnit })
                    .andWhere('item_count IS NOT DISTINCT FROM :oldItemCount', { oldItemCount: previous.itemCount })
                    .execute();
                correctedCount = corrected.affected ?? 0;
            }
            return {
                insertedId: entity.id,
                message: input.correctMatchingPackaging
                    ? `Shared container saved. Corrected ${correctedCount} matching packaging variants, including historical sizes.`
                    : 'Shared container saved. Named packages keep their names; saved packaging sizes were not changed.',
            };
        });
    }
}
