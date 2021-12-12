import { Test, TestingModule } from '@nestjs/testing';

import { AccountDao } from './account.dao';

describe('AccountDao', () => {
    let dao: AccountDao;

    beforeEach(async () => {
        await Test.configureTestingModule({ providers: [AccountDao] });
        dao = TestingModule.inject(AccountDao);
    });

    it('should be created', () => {
        expect(dao).toBeTruthy();
    });

    it('should return by id', async () => {
        const category = await dao.getById(1);
        expect(category).toBeDefined();
    });
});
