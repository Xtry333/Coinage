import { TestBed } from '@angular/core/testing';

import { AccountDao } from './account.dao';

describe('AccountDao', () => {
    let dao: AccountDao;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        dao = TestBed.inject(AccountDao);
    });

    it('should be created', () => {
        expect(dao).toBeTruthy();
    });

    it('should return by id', async () => {
        const category = await dao.getById(1);
        expect(category).toBeDefined();
    });
});
