import { Test, TestingModule } from '@nestjs/testing';

import { TemplateNameMapperService } from './template-name-mapper.service';
import { Transfer } from '../entities/Transfer.entity';
import { Account } from '../entities/Account.entity';

describe('TemplateNameMapperService', () => {
    let service: TemplateNameMapperService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TemplateNameMapperService],
        }).compile();

        service = module.get<TemplateNameMapperService>(TemplateNameMapperService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should replace %account% template with account name from transfer', () => {
        const transfers = [createTransferMock('%account%', 'xxx'), createTransferMock('Contractor %account%', 'xxx'), createTransferMock('Contractor', 'yyy')];

        service.mapTransfersTemplateNames(transfers);

        for (const transfer of transfers) {
            expect(transfer.contractor?.name).not.toContain(TemplateNameMapperService.ACCOUNT_NAME);
        }

        expect(transfers[0].contractor?.name).toContain('xxx');
        expect(transfers[1].contractor?.name).toContain('xxx');
        expect(transfers[2].contractor?.name).not.toContain('yyy');
    });

    function createTransferMock(contractorName: string, accountName: string): Transfer {
        const transfer = new Transfer();
        transfer.contractor = { id: 1, name: contractorName };
        transfer.account = new Account();
        transfer.account.name = accountName;

        return transfer;
    }
});
