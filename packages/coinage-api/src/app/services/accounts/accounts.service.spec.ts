import { Chance } from 'chance';
import { createSpyFromClass, Spy } from 'jest-auto-spies';
import { AccountDao } from '../../daos/account.dao';
import { AccountsService } from './accounts.service';
import { createMockAccounts } from '@coinage-app/test/mock-generators/accounts.mock';

describe('AccountsService', () => {
    let service: AccountsService, accountDao: Spy<AccountDao>;

    const chance = new Chance();
    const mockAccounts = createMockAccounts(2);

    beforeEach(() => {
        accountDao = createSpyFromClass(AccountDao);
        jest.spyOn(accountDao, 'getForUserId').mockResolvedValue(mockAccounts);

        service = new AccountsService(accountDao);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('.getForUserId', () => {
        it('should call dao.getForUserId', async () => {
            const userId = chance.natural({ max: 100 });
            const result = await service.getForUserId(userId);

            expect(accountDao.getForUserId).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockAccounts);
        });
    });
});
