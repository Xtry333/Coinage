import { Test, TestingModule } from '@nestjs/testing';

import { EtherealTransferService } from './ethereal-transfer.service';
import { PartialProvider } from '../../test/partial-provider';
import { TransferDao } from '../daos/transfer.dao';
import { AccountDao } from '../daos/account.dao';

describe('EtherealTransferService', () => {
    let service: EtherealTransferService;
    let transferDao: TransferDao;

    const transferDaoProvider: PartialProvider<TransferDao> = {
        provide: TransferDao,
        useValue: {
            getById: jest.fn().mockResolvedValue(mockTransfer()),
            save: jest.fn().mockResolvedValue(undefined),
            deleteEthereals: jest.fn().mockResolvedValue(4),
        },
    };

    const accountDaoProvider: PartialProvider<AccountDao> = {
        provide: AccountDao,
        useValue: {
            getCurrentlyActiveForUserId: () => {
                throw new Error('Test not implemented.');
            },
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EtherealTransferService, transferDaoProvider, accountDaoProvider],
        }).compile();

        service = module.get<EtherealTransferService>(EtherealTransferService);
        transferDao = module.get<TransferDao>(TransferDao);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should call remove all ethereals', () => {
        service.cleanup();

        expect(transferDao.deleteEthereals).toHaveBeenCalled();
    });

    it('should commit transfer and remove ethereal tag', async () => {
        const result = await service.commit(1);

        expect(transferDao.getById).toHaveBeenCalledWith(1);
        expect(transferDao.save).toHaveBeenCalledWith({ id: 1, isEthereal: false });
        expect(result.isEthereal).toBe(false);
    });

    it('should revert transfer to temporary state', async () => {
        const result = await service.stage(1);

        expect(transferDao.getById).toHaveBeenCalledWith(1);
        expect(transferDao.save).toHaveBeenCalledWith({ id: 1, isEthereal: true });
        expect(result.isEthereal).toBe(true);
    });

    function mockTransfer() {
        return { id: 1, isEthereal: false };
    }
});
