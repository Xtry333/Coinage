import { DataSource } from 'typeorm';

import { Container } from '../entities/Container.entity';
import { ItemPackaging } from '../entities/ItemPackaging.entity';
import { SharedContainersService } from './shared-containers.service';

describe('SharedContainersService', () => {
    let service: SharedContainersService;
    let container: Container;
    let repository: { findOne: jest.Mock; save: jest.Mock };
    let query: { update: jest.Mock; set: jest.Mock; where: jest.Mock; andWhere: jest.Mock; execute: jest.Mock };
    let transaction: jest.Mock;

    beforeEach(() => {
        container = Object.assign(new Container(), { id: 7, name: 'Can', weight: null, weightUnit: null, volume: 330, volumeUnit: 'ml', itemCount: 1 });
        repository = { findOne: jest.fn().mockResolvedValue(container), save: jest.fn(async (value) => value) };
        query = {
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 2 }),
        };
        const manager = { getRepository: () => repository, createQueryBuilder: () => query };
        transaction = jest.fn(async (callback) => callback(manager));
        service = new SharedContainersService({ transaction } as unknown as DataSource);
    });

    it('edits the existing shared definition without changing snapshots by default', async () => {
        const result = await service.update(7, { name: '  Tin  ', volume: 500 });
        expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 7 }, lock: { mode: 'for_no_key_update' } });
        expect(container).toMatchObject({ id: 7, name: 'Tin', volume: 500, volumeUnit: 'ml', itemCount: 1 });
        expect(query.execute).not.toHaveBeenCalled();
        expect(result.insertedId).toBe(7);
        expect(result.message).toContain('saved packaging sizes were not changed');
    });

    it.each([undefined, false, 'true'])('requires explicit acknowledgement for historical corrections: %p', async (acknowledgement) => {
        await expect(
            service.update(7, {
                volume: 500,
                correctMatchingPackaging: true,
                acknowledgeHistoricalImpact: acknowledgement as boolean,
            }),
        ).rejects.toThrow('Acknowledge');
        expect(transaction).not.toHaveBeenCalled();
    });

    it('corrects only variants matching the previous complete size, including archived variants', async () => {
        const result = await service.update(7, { volume: 500, correctMatchingPackaging: true, acknowledgeHistoricalImpact: true });
        expect(query.update).toHaveBeenCalledWith(ItemPackaging);
        expect(query.set).toHaveBeenCalledWith({ weight: null, weightUnit: null, volume: 500, volumeUnit: 'ml', itemCount: 1 });
        expect(query.where).toHaveBeenCalledWith('container_id = :containerId', { containerId: 7 });
        expect(query.andWhere.mock.calls).toEqual([
            ['contained_packaging_id IS NULL'],
            ['weight IS NOT DISTINCT FROM :oldWeight', { oldWeight: null }],
            ['weight_unit IS NOT DISTINCT FROM :oldWeightUnit', { oldWeightUnit: null }],
            ['volume IS NOT DISTINCT FROM :oldVolume', { oldVolume: 330 }],
            ['volume_unit IS NOT DISTINCT FROM :oldVolumeUnit', { oldVolumeUnit: 'ml' }],
            ['item_count IS NOT DISTINCT FROM :oldItemCount', { oldItemCount: 1 }],
        ]);
        expect(result.message).toContain('2 matching packaging variants');
    });

    it('does not rewrite sizes for a name-only edit, even with correction opted in', async () => {
        await service.update(7, { name: 'Tin', correctMatchingPackaging: true, acknowledgeHistoricalImpact: true });
        expect(query.execute).not.toHaveBeenCalled();
    });

    it.each([{ volume: -1 }, { volumeUnit: 'kg' }, { itemCount: 0.5 }, { name: 'a'.repeat(65) }])('rejects invalid edits without saving: %p', async (input) => {
        await expect(service.update(7, input)).rejects.toThrow();
        expect(repository.save).not.toHaveBeenCalled();
        expect(query.execute).not.toHaveBeenCalled();
    });

    it('rejects malformed correction flags instead of treating strings as consent', async () => {
        await expect(service.update(7, { correctMatchingPackaging: 'false' as unknown as boolean })).rejects.toThrow();
        expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects missing containers', async () => {
        repository.findOne.mockResolvedValue(null);
        await expect(service.update(99, { name: 'Missing' })).rejects.toThrow('Container not found');
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('propagates update failures to roll back the transaction', async () => {
        query.execute.mockRejectedValue(new Error('Database failure'));
        await expect(service.update(7, { volume: 500, correctMatchingPackaging: true, acknowledgeHistoricalImpact: true })).rejects.toThrow('Database failure');
    });
});
