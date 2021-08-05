import { TestBed } from '@angular/core/testing';

import { ContractorDao } from './contractor.dao';

describe('ContractorDao', () => {
    let dao: ContractorDao;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        dao = TestBed.inject(ContractorDao);
    });

    it('should be created', () => {
        expect(dao).toBeTruthy();
    });

    it('should return by id', async () => {
        const contractor = await dao.getById(1);
        expect(contractor).toBeDefined();
    });
});
