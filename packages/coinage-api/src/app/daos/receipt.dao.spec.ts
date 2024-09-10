import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptDao } from './receipt.dao';

describe('ReceiptDao', () => {
    let dao: ReceiptDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ReceiptDao],
        }).compile();

        dao = module.get(ReceiptDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
