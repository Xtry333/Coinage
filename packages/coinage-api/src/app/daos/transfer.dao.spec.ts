import { Test, TestingModule } from '@nestjs/testing';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';
import { TransferDao } from './transfer.dao';

describe('TransferDao', () => {
    let dao: TransferDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransferDao,
                {
                    provide: 'TransferRepository',
                    useValue: { findOne: jest.fn(), find: jest.fn() },
                },
                {
                    provide: TemplateNameMapperService,
                    useValue: { mapTransfersTemplateNames: jest.fn() },
                },
            ],
        }).compile();

        dao = module.get(TransferDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
