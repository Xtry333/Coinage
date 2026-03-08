import { Test, TestingModule } from '@nestjs/testing';

import { ContractorDao } from '../daos/contractor.dao';
import { Contractor } from '../entities/Contractor.entity';
import { PartialProvider } from '../../test/partial-provider';
import { ContractorController } from './contractors.controller';

function makeContractor(id: number, name: string): Contractor {
    const c = new Contractor();
    c.id = id;
    c.name = name;
    return c;
}

describe('ContractorController', () => {
    let controller: ContractorController;
    let contractorDao: jest.Mocked<Partial<ContractorDao>>;

    beforeEach(async () => {
        contractorDao = {
            getActive: jest.fn(),
            getById: jest.fn(),
            save: jest.fn(),
        };

        const contractorDaoProvider: PartialProvider<ContractorDao> = {
            provide: ContractorDao,
            useValue: contractorDao,
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContractorController],
            providers: [contractorDaoProvider],
        }).compile();

        controller = module.get<ContractorController>(ContractorController);
    });

    describe('getCategoryList', () => {
        it('returns active contractors mapped to DTOs sorted alphabetically by name', async () => {
            const contractors = [makeContractor(1, 'Zebra Corp'), makeContractor(2, 'Alpha Inc'), makeContractor(3, 'Midpoint LLC')];
            contractorDao.getActive!.mockResolvedValue(contractors);

            const result = await controller.getCategoryList();

            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('Alpha Inc');
            expect(result[1].name).toBe('Midpoint LLC');
            expect(result[2].name).toBe('Zebra Corp');
        });

        it('maps each contractor to an object with id and name only', async () => {
            contractorDao.getActive!.mockResolvedValue([makeContractor(5, 'Test Corp')]);

            const result = await controller.getCategoryList();

            expect(result[0]).toEqual({ id: 5, name: 'Test Corp' });
        });

        it('returns empty array when no active contractors exist', async () => {
            contractorDao.getActive!.mockResolvedValue([]);

            const result = await controller.getCategoryList();

            expect(result).toEqual([]);
        });
    });

    describe('saveContractor', () => {
        it('creates a new contractor when no id is provided', async () => {
            const saved = makeContractor(10, 'New Contractor');
            contractorDao.save!.mockResolvedValue(saved);

            const result = await controller.saveContractor({ name: 'New Contractor' } as any);

            expect(contractorDao.getById).not.toHaveBeenCalled();
            expect(contractorDao.save).toHaveBeenCalled();
            expect(result.insertedId).toBe(10);
        });

        it('updates an existing contractor when id is provided', async () => {
            const existing = makeContractor(5, 'Old Name');
            const saved = makeContractor(5, 'Updated Name');
            contractorDao.getById!.mockResolvedValue(existing);
            contractorDao.save!.mockResolvedValue(saved);

            const result = await controller.saveContractor({ id: 5, name: 'Updated Name' } as any);

            expect(contractorDao.getById).toHaveBeenCalledWith(5);
            expect(result.insertedId).toBe(5);
        });

        it('sets the name on the entity before saving', async () => {
            const existing = makeContractor(5, 'Old Name');
            contractorDao.getById!.mockResolvedValue(existing);
            contractorDao.save!.mockImplementation(async (e) => e as Contractor);

            await controller.saveContractor({ id: 5, name: 'New Name' } as any);

            const savedEntity = contractorDao.save!.mock.calls[0][0] as Contractor;
            expect(savedEntity.name).toBe('New Name');
        });

        it('throws an error when id is provided but contractor not found', async () => {
            contractorDao.getById!.mockResolvedValue(null as any);

            await expect(controller.saveContractor({ id: 99, name: 'Missing' } as any)).rejects.toThrow('Id not found.');
        });
    });
});
