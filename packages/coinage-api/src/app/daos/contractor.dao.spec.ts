import { Test, TestingModule } from '@nestjs/testing';
import { ContractorDao } from './contractor.dao';

describe('ContractorDao', () => {
    let dao: ContractorDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractorDao,
                {
                    provide: 'ContractorRepository',
                    useValue: { findOne: jest.fn(), find: jest.fn(), findBy: jest.fn() },
                },
            ],
        }).compile();

        dao = module.get(ContractorDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
