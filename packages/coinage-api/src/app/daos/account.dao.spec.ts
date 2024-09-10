import { Test, TestingModule } from '@nestjs/testing';
import { DateParserService } from '../services/date-parser.service';
import { AccountDao } from './account.dao';

describe('AccountDao', () => {
    let dao: AccountDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AccountDao, DateParserService],
        }).compile();

        dao = module.get(AccountDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
