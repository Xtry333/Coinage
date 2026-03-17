import { Test, TestingModule } from '@nestjs/testing';

import { Account } from '../entities/Account.entity';
import { Contractor } from '../entities/Contractor.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TemplateNameMapperService } from './template-name-mapper.service';

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

    it('should replace %account-origin% template with account name from transfer', () => {
        const transfers = [
            createTransferMock('%account-origin%', 'xxx'),
            createTransferMock('Contractor %account-origin%', 'xxx'),
            createTransferMock('Contractor', 'yyy'),
        ];

        service.mapTransfersTemplateNames(transfers);

        for (const transfer of transfers) {
            expect(transfer.contractor?.name).not.toContain(TemplateNameMapperService.ACCOUNT_ORIGIN_NAME);
        }

        expect(transfers[0].contractor?.name).toContain('xxx');
        expect(transfers[1].contractor?.name).toContain('xxx');
        expect(transfers[2].contractor?.name).not.toContain('yyy');
    });

    function createTransferMock(contractorName: string, accountName: string): Transfer {
        const transfer = new Transfer();
        const contractor = new Contractor();
        contractor.id = 1;
        contractor.name = contractorName;
        contractor.isActive = true;
        transfer.contractor = contractor;
        const account = new Account();
        account.name = accountName;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transfer as any).originAccount = account;

        return transfer;
    }
});
