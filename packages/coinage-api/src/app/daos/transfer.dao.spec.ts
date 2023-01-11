import { Test, TestingModule } from '@nestjs/testing';
import { TransferDao } from './transfer.dao';

describe('TransferDao', () => {
    let dao: TransferDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TransferDao],
        }).compile();

        dao = module.get(TransferDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
