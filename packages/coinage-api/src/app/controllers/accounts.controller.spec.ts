import { Test, TestingModule } from '@nestjs/testing';
import { AccountDao } from '../daos/account.dao';
import { DateParserService } from '../services/date-parser.service';
import { AccountsController } from './accounts.controller';

describe('AccountsController', () => {
    let controller: AccountsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AccountsController,
                DateParserService,
                {
                    provide: AccountDao,
                    useValue: {
                        getAccountBalanceForAccountAsOfDate: jest.fn().mockResolvedValue([]),
                    },
                },
            ],
        }).compile();

        controller = module.get(AccountsController);
    });

    it('should be created', async () => {
        expect(controller).toBeTruthy();
    });
});
