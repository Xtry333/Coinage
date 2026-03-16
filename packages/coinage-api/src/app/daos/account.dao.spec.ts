import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DatabaseSourceService } from '../services/database-source.service';
import { DateParserService } from '../services/date-parser.service';
import { AccountDao } from './account.dao';

describe('AccountDao', () => {
    let dao: AccountDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AccountDao,
                DateParserService,
                {
                    provide: 'AccountRepository',
                    useValue: { findOne: jest.fn(), find: jest.fn(), findBy: jest.fn() },
                },
                {
                    provide: DataSource,
                    useValue: { getRepository: jest.fn() },
                },
                {
                    provide: DatabaseSourceService,
                    useValue: {},
                },
            ],
        }).compile();

        dao = module.get(AccountDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
