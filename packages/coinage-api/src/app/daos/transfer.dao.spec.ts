import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Transfer } from '../entities/Transfer.entity';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';
import { TransferDao } from './transfer.dao';

describe('TransferDao', () => {
    let dao: TransferDao;
    let repository: Repository<Transfer>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransferDao,
                {
                    provide: 'TransferRepository',
                    useValue: { findOne: jest.fn(), find: jest.fn(), save: jest.fn() },
                },
                {
                    provide: TemplateNameMapperService,
                    useValue: { mapTransfersTemplateNames: jest.fn() },
                },
            ],
        }).compile();

        dao = module.get(TransferDao);
        repository = module.get(getRepositoryToken(Transfer));
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });

    it('writes only direct tags and an edit timestamp, not computed transfer fields', async () => {
        await dao.setTags(3, []);
        expect(repository.save).toHaveBeenCalledWith({ id: 3, tags: [], editedDate: expect.any(Date) });
    });
});
