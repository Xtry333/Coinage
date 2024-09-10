import { createMockAccounts } from '@coinage-app/test/mock-generators/accounts.mock';
import { Test, TestingModule } from '@nestjs/testing';
import { PartialProvider } from '../../test/partial-provider';
import { AccountDao } from '../daos/account.dao';
import { UserDao } from '../daos/user.dao';
import { AccountBalanceService } from '../services/account-balance.service';
import { AccountsService } from '../services/accounts/accounts.service';
import { AuthGuard } from '../services/auth.guard';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { AccountsController } from './accounts.controller';

describe('AccountsController', () => {
    let controller: AccountsController, accountsService: AccountsService;

    const mockAccounts = createMockAccounts(2);

    const authGuardProvider: PartialProvider<AuthGuard> = {
        provide: AuthGuard,
        useValue: {
            canActivate: jest.fn(() => Promise.resolve(true)),
        },
    };

    const userDaoProvider: PartialProvider<UserDao> = {
        provide: UserDao,
        useValue: {},
    };

    const accountsServiceProvider: PartialProvider<AccountsService> = {
        provide: AccountsService,
        useValue: {
            getForUserId: jest.fn(() => Promise.resolve(mockAccounts)),
        },
    };

    const etherealTransferServiceProvider: PartialProvider<EtherealTransferService> = {
        provide: EtherealTransferService,
        useValue: {},
    };

    const accountBalanceServiceProvider: PartialProvider<AccountBalanceService> = {
        provide: AccountBalanceService,
        useValue: {},
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AccountsController,
                authGuardProvider,
                userDaoProvider,
                {
                    provide: AccountDao,
                    useValue: {
                        getAccountBalanceForAccountAsOfDate: jest.fn().mockResolvedValue([]),
                    },
                },
                accountsServiceProvider,
                etherealTransferServiceProvider,
                DateParserService,
                accountBalanceServiceProvider,
            ],
        }).compile();

        controller = module.get(AccountsController);
        accountsService = module.get(AccountsService);
    });

    it('should be created', async () => {
        expect(controller).toBeTruthy();
    });

    describe('.getAccountsForUserId', () => {
        it('should call .getForUserId', async () => {
            const userId = 86;
            const result = await controller.getAccountsForUserId(userId);

            expect(accountsService.getForUserId).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockAccounts);
        });
    });
});
