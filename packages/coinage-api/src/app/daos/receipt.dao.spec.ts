import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';
import { ReceiptDao } from './receipt.dao';

describe('ReceiptDao', () => {
    let dao: ReceiptDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReceiptDao,
                {
                    provide: 'ReceiptRepository',
                    useValue: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() },
                },
                {
                    provide: TemplateNameMapperService,
                    useValue: { mapTransfersTemplateNames: jest.fn() },
                },
                {
                    provide: DataSource,
                    useValue: { getRepository: jest.fn() },
                },
            ],
        }).compile();

        dao = module.get(ReceiptDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
