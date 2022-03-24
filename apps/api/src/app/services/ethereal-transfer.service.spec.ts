import { Test, TestingModule } from '@nestjs/testing';

import { EtherealTransferService } from './ethereal-transfer.service';
import { PartialProvider } from '../test/partial-provider';
import { TransferDao } from '../daos/transfer.dao';

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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EtherealTransferService, transferDaoProvider],
        }).compile();

        service = module.get<EtherealTransferService>(EtherealTransferService);
        transferDao = module.get<TransferDao>(TransferDao);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should call remove all ethereals', () => {
        service.cleanupEtherealTransfers();

        expect(transferDao.deleteEthereals).toHaveBeenCalled();
    });

    it('should commit transfer and remove ethereal tag', async () => {
        const result = await service.commitTransfer(1);

        expect(transferDao.getById).toHaveBeenCalledWith(1);
        expect(transferDao.save).toHaveBeenCalledWith(mockTransfer());
        expect(result.isEthereal).toBe(false);
    });

    it('should revert transfer to temporary state', async () => {
        const result = await service.convertToEthereal(1);

        expect(transferDao.getById).toHaveBeenCalledWith(1);
        expect(result.isEthereal).toBe(true);
    });

    function mockTransfer() {
        return { id: 1, isEthereal: false };
    }
});
