import { createSpyFromClass, Spy } from 'jest-auto-spies';

import { AccountDao } from '../daos/account.dao';
import { DateParserService } from './date-parser.service';
import { AccountBalanceService } from './account-balance.service';

describe('AccountBalanceService', () => {
    let service: AccountBalanceService;
    let accountDao: Spy<AccountDao>;
    let dateParser: Spy<DateParserService>;

    beforeEach(() => {
        accountDao = createSpyFromClass(AccountDao);
        dateParser = createSpyFromClass(DateParserService);
        service = new AccountBalanceService(accountDao, dateParser);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('.getAccountsBalanceByIds', () => {
        it('should return balance data mapped from DAO', async () => {
            accountDao.getBalanceNew.mockResolvedValue([
                { accountId: 1, accountName: 'Main', balance: '1234.56', currencySymbol: 'PLN' },
                { accountId: 2, accountName: 'Savings', balance: '9999.00', currencySymbol: 'EUR' },
            ] as any);

            const result = await service.getAccountsBalanceByIds([1, 2]);

            expect(accountDao.getBalanceNew).toHaveBeenCalledWith({ accountIds: [1, 2] }, undefined);
            expect(result).toEqual([
                { accountId: 1, name: 'Main', balance: 1234.56, currencySymbol: 'PLN' },
                { accountId: 2, name: 'Savings', balance: 9999.0, currencySymbol: 'EUR' },
            ]);
        });

        it('should pass asOfDate to DAO when provided', async () => {
            const date = new Date('2024-01-31');
            accountDao.getBalanceNew.mockResolvedValue([]);

            await service.getAccountsBalanceByIds([1], date);

            expect(accountDao.getBalanceNew).toHaveBeenCalledWith({ accountIds: [1] }, date);
        });

        it('should return empty array when no accounts provided', async () => {
            accountDao.getBalanceNew.mockResolvedValue([]);

            const result = await service.getAccountsBalanceByIds([]);

            expect(result).toEqual([]);
        });

        it('should parse balance string to float', async () => {
            accountDao.getBalanceNew.mockResolvedValue([
                { accountId: 1, accountName: 'Test', balance: '100.5', currencySymbol: 'PLN' },
            ] as any);

            const [result] = await service.getAccountsBalanceByIds([1]);

            expect(result.balance).toBe(100.5);
            expect(typeof result.balance).toBe('number');
        });
    });

    describe('.getAccountDailyBalanceById', () => {
        it('should return assembled account details with daily balance', async () => {
            accountDao.getById.mockResolvedValue({
                id: 1,
                name: 'Main',
                userId: 42,
                currency: { symbol: 'PLN' },
            } as any);
            const mockDailyBalance = [{ date: '2024-01-01', balance: 100 }];
            accountDao.getSingularAccountDailyBalance.mockResolvedValue(mockDailyBalance as any);

            const result = await service.getAccountDailyBalanceById(1);

            expect(accountDao.getById).toHaveBeenCalledWith(1);
            expect(accountDao.getSingularAccountDailyBalance).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                accountId: 1,
                accountName: 'Main',
                accountOwnerUserId: 42,
                accountCurrency: 'PLN',
                dailyBalance: mockDailyBalance,
            });
        });
    });

    describe('.getAccountsBalanceForUserId', () => {
        it('should compute balance as incoming minus outgoing for each account', async () => {
            accountDao.getForUserId.mockResolvedValue([{ id: 1 } as any, { id: 2 } as any]);
            accountDao.getSubBalanceByFilter.mockResolvedValue([
                { toAccountId: 1, fromAccountId: null, subBalance: 500 },
                { toAccountId: 1, fromAccountId: null, subBalance: 300 },
                { toAccountId: null, fromAccountId: 1, subBalance: 200 },
                { toAccountId: 2, fromAccountId: null, subBalance: 100 },
            ] as any);

            const result = await service.getAccountsBalanceForUserId(10);

            expect(accountDao.getForUserId).toHaveBeenCalledWith(10);
            expect(accountDao.getSubBalanceByFilter).toHaveBeenCalledWith({ userId: 10 });
            expect(result).toEqual([
                { accountId: 1, balance: 600 }, // 500 + 300 - 200
                { accountId: 2, balance: 100 }, // 100 - 0
            ]);
        });

        it('should return zero balance for accounts with no transactions', async () => {
            accountDao.getForUserId.mockResolvedValue([{ id: 1 } as any]);
            accountDao.getSubBalanceByFilter.mockResolvedValue([]);

            const result = await service.getAccountsBalanceForUserId(1);

            expect(result).toEqual([{ accountId: 1, balance: 0 }]);
        });

        it('should return empty array for user with no accounts', async () => {
            accountDao.getForUserId.mockResolvedValue([]);
            accountDao.getSubBalanceByFilter.mockResolvedValue([]);

            const result = await service.getAccountsBalanceForUserId(99);

            expect(result).toEqual([]);
        });
    });
});
