import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { createMockAccounts } from '../../test/mock-generators/accounts.mock';
import { PartialProvider } from '../../test/partial-provider';
import { AuthService } from '../auth/auth.service';
import { AccountDao } from '../daos/account.dao';
import { UserDao } from '../daos/user.dao';
import { AccountBalanceService } from '../services/account-balance.service';
import { AuthGuard } from '../services/auth.guard';
import { DashboardComponent } from './dashboard.controller';

describe('DashboardController', () => {
    let controller: DashboardComponent;
    let accountDao: jest.Mocked<Partial<AccountDao>>;
    let accountBalanceService: jest.Mocked<Partial<AccountBalanceService>>;

    const mockUser = { id: 42 } as any;
    const mockAccounts = createMockAccounts(2);

    const authGuardProvider: PartialProvider<AuthGuard> = {
        provide: AuthGuard,
        useValue: { canActivate: jest.fn(() => Promise.resolve(true)) },
    };

    const userDaoProvider: PartialProvider<UserDao> = {
        provide: UserDao,
        useValue: {},
    };

    const authServiceProvider: PartialProvider<AuthService> = {
        provide: AuthService,
        useValue: {},
    };

    beforeEach(async () => {
        accountDao = {
            getForUserId: jest.fn(),
        };
        accountBalanceService = {
            getAccountsBalanceByIds: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardComponent,
                authGuardProvider,
                userDaoProvider,
                authServiceProvider,
                { provide: AccountDao, useValue: accountDao },
                { provide: AccountBalanceService, useValue: accountBalanceService },
                { provide: HttpService, useValue: {} },
            ],
        }).compile();

        controller = module.get(DashboardComponent);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('.getBalance', () => {
        it('should fetch accounts for user and return their balances', async () => {
            const mockBalances = [{ accountId: 0, name: 'Account 0', balance: 1000, currencySymbol: 'PLN' }];
            (accountDao.getForUserId as jest.Mock).mockResolvedValue(mockAccounts);
            (accountBalanceService.getAccountsBalanceByIds as jest.Mock).mockResolvedValue(mockBalances);

            const result = await controller.getBalance(mockUser, '2024-01-15' as any);

            expect(accountDao.getForUserId).toHaveBeenCalledWith(42);
            expect(accountBalanceService.getAccountsBalanceByIds).toHaveBeenCalledWith(
                mockAccounts.map((a) => a.id),
                expect.any(Date),
            );
            expect(result).toBe(mockBalances);
        });

        it('should convert date string to Date object', async () => {
            (accountDao.getForUserId as jest.Mock).mockResolvedValue([]);
            (accountBalanceService.getAccountsBalanceByIds as jest.Mock).mockResolvedValue([]);

            await controller.getBalance(mockUser, '2024-06-30' as any);

            const callArgs = (accountBalanceService.getAccountsBalanceByIds as jest.Mock).mock.calls[0];
            expect(callArgs[1]).toBeInstanceOf(Date);
        });

        it('should return empty array when user has no accounts', async () => {
            (accountDao.getForUserId as jest.Mock).mockResolvedValue([]);
            (accountBalanceService.getAccountsBalanceByIds as jest.Mock).mockResolvedValue([]);

            const result = await controller.getBalance(mockUser, '2024-01-01' as any);

            expect(accountBalanceService.getAccountsBalanceByIds).toHaveBeenCalledWith([], expect.any(Date));
            expect(result).toEqual([]);
        });
    });
});
