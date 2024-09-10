import { Test, TestingModule } from '@nestjs/testing';
import { ContractorDao } from './contractor.dao';

describe('ContractorDao', () => {
    let dao: ContractorDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ContractorDao],
        }).compile();

        dao = module.get(ContractorDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
