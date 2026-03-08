import { Test, TestingModule } from '@nestjs/testing';

import { PartialProvider } from '../../test/partial-provider';
import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { ScheduleDao } from '../daos/schedule.dao';
import { TransferDao } from '../daos/transfer.dao';
import { UserDao } from '../daos/user.dao';
import { AccountBalanceService } from '../services/account-balance.service';
import { AuthGuard } from '../services/auth.guard';
import { DateParserService } from '../services/date-parser.service';
import { EtherealTransferService } from '../services/ethereal-transfer.service';
import { SaveTransfersService } from '../services/transfers/save-transfers.service';
import { TransfersService } from '../services/transfers.service';
import { TransfersController } from './transfers.controller';

describe('TransfersController', () => {
    let controller: TransfersController;
    let transferDao: jest.Mocked<Partial<TransferDao>>;
    let transfersService: jest.Mocked<Partial<TransfersService>>;
    let userDao: jest.Mocked<Partial<UserDao>>;
    let scheduleDao: jest.Mocked<Partial<ScheduleDao>>;
    let receiptDao: jest.Mocked<Partial<ReceiptDao>>;

    const mockUserId = 1;
    const mockUserAccountIds = [10, 11];

    function makeMockUser(accountIds: number[]) {
        return {
            id: mockUserId,
            accounts: Promise.resolve(accountIds.map((id) => ({ id }))),
        };
    }

    beforeEach(async () => {
        transferDao = {
            findByIds: jest.fn(),
            bulkUpdate: jest.fn(),
            bulkDelete: jest.fn(),
            getAll: jest.fn(),
        };
        transfersService = {
            getAllFilteredPagedDTO: jest.fn(),
            getAllFilteredCount: jest.fn(),
            getRecentTransfersForUserDTO: jest.fn(),
        };
        userDao = {
            getById: jest.fn(),
        };
        scheduleDao = {
            getById: jest.fn(),
        };
        receiptDao = {
            getById: jest.fn(),
        };

        const authGuardProvider: PartialProvider<AuthGuard> = {
            provide: AuthGuard,
            useValue: { canActivate: jest.fn(() => Promise.resolve(true)) },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransfersController,
                authGuardProvider,
                { provide: TransferDao, useValue: transferDao },
                { provide: TransfersService, useValue: transfersService },
                { provide: UserDao, useValue: userDao },
                { provide: ScheduleDao, useValue: scheduleDao },
                { provide: ReceiptDao, useValue: receiptDao },
                { provide: CategoryDao, useValue: {} },
                { provide: AccountDao, useValue: {} },
                { provide: AccountBalanceService, useValue: {} },
                { provide: DateParserService, useValue: {} },
                { provide: EtherealTransferService, useValue: {} },
                { provide: SaveTransfersService, useValue: {} },
            ],
        }).compile();

        controller = module.get(TransfersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('.getAllFilteredTransfers', () => {
        it('should normalize page to 1 when page is 0 or negative', async () => {
            const filter = { page: 0, rowsPerPage: 10, userId: null } as any;
            (transfersService.getAllFilteredPagedDTO as jest.Mock).mockResolvedValue([]);
            (transfersService.getAllFilteredCount as jest.Mock).mockResolvedValue(0);

            await controller.getAllFilteredTransfers(mockUserId, filter);

            expect(filter.page).toBe(1);
        });

        it('should normalize rowsPerPage to 100 when rowsPerPage is 0 or negative', async () => {
            const filter = { page: 1, rowsPerPage: -1, userId: null } as any;
            (transfersService.getAllFilteredPagedDTO as jest.Mock).mockResolvedValue([]);
            (transfersService.getAllFilteredCount as jest.Mock).mockResolvedValue(0);

            await controller.getAllFilteredTransfers(mockUserId, filter);

            expect(filter.rowsPerPage).toBe(100);
        });

        it('should return transfers and totalCount from service', async () => {
            const mockTransfers = [{ id: 1 }, { id: 2 }] as any;
            const filter = { page: 1, rowsPerPage: 10, userId: null } as any;
            (transfersService.getAllFilteredPagedDTO as jest.Mock).mockResolvedValue(mockTransfers);
            (transfersService.getAllFilteredCount as jest.Mock).mockResolvedValue(2);

            const result = await controller.getAllFilteredTransfers(mockUserId, filter);

            expect(result.transfers).toBe(mockTransfers);
            expect(result.totalCount).toBe(2);
        });

        it('should append user account IDs to accountIds when userId filter is set', async () => {
            const filter = { page: 1, rowsPerPage: 10, userId: mockUserId, accountIds: undefined } as any;
            (userDao.getById as jest.Mock).mockResolvedValue(makeMockUser(mockUserAccountIds));
            (transfersService.getAllFilteredPagedDTO as jest.Mock).mockResolvedValue([]);
            (transfersService.getAllFilteredCount as jest.Mock).mockResolvedValue(0);

            await controller.getAllFilteredTransfers(mockUserId, filter);

            expect(userDao.getById).toHaveBeenCalledWith(mockUserId);
            expect(filter.accountIds).toEqual(mockUserAccountIds);
        });

        it('should merge existing accountIds with user account IDs when both present', async () => {
            const filter = { page: 1, rowsPerPage: 10, userId: mockUserId, accountIds: [5, 6] } as any;
            (userDao.getById as jest.Mock).mockResolvedValue(makeMockUser([10, 11]));
            (transfersService.getAllFilteredPagedDTO as jest.Mock).mockResolvedValue([]);
            (transfersService.getAllFilteredCount as jest.Mock).mockResolvedValue(0);

            await controller.getAllFilteredTransfers(mockUserId, filter);

            expect(filter.accountIds).toEqual([5, 6, 10, 11]);
        });
    });

    describe('.getRecentTransactions', () => {
        it('should call service with count=10 and return results', async () => {
            const mockTransfers = [{ id: 1 }] as any;
            (transfersService.getRecentTransfersForUserDTO as jest.Mock).mockResolvedValue(mockTransfers);

            const result = await controller.getRecentTransactions(mockUserId);

            expect(transfersService.getRecentTransfersForUserDTO).toHaveBeenCalledWith(mockUserId, 10);
            expect(result).toBe(mockTransfers);
        });
    });

    describe('.bulkEditTransfers', () => {
        it('should return error when some transfers do not belong to user', async () => {
            (userDao.getById as jest.Mock).mockResolvedValue(makeMockUser([10]));
            (transferDao.findByIds as jest.Mock).mockResolvedValue([
                { id: 1, originAccountId: 10 },
                { id: 2, originAccountId: 99 }, // not user's account
            ]);

            const request = { transferIds: [1, 2] } as any;
            const result = await controller.bulkEditTransfers(mockUserId, request);

            expect(result.error).toBeDefined();
            expect(transferDao.bulkUpdate).not.toHaveBeenCalled();
        });

        it('should update transfers and return insertedId count on success', async () => {
            (userDao.getById as jest.Mock).mockResolvedValue(makeMockUser([10, 11]));
            (transferDao.findByIds as jest.Mock).mockResolvedValue([
                { id: 1, originAccountId: 10 },
                { id: 2, originAccountId: 11 },
            ]);
            (transferDao.bulkUpdate as jest.Mock).mockResolvedValue(undefined);

            const request = { transferIds: [1, 2], description: 'Updated' } as any;
            const result = await controller.bulkEditTransfers(mockUserId, request);

            expect(transferDao.bulkUpdate).toHaveBeenCalled();
            expect(result.insertedId).toBe(2);
            expect(result.error).toBeUndefined();
        });

        it('should return error when schedule is not found', async () => {
            (userDao.getById as jest.Mock).mockResolvedValue(makeMockUser([10]));
            (transferDao.findByIds as jest.Mock).mockResolvedValue([{ id: 1, originAccountId: 10 }]);
            (scheduleDao.getById as jest.Mock).mockRejectedValue(new Error('Not found'));

            const request = { transferIds: [1], scheduleId: 999 } as any;
            const result = await controller.bulkEditTransfers(mockUserId, request);

            expect(result.error).toBe('Schedule not found');
        });

        it('should return error when receipt is not found', async () => {
            (userDao.getById as jest.Mock).mockResolvedValue(makeMockUser([10]));
            (transferDao.findByIds as jest.Mock).mockResolvedValue([{ id: 1, originAccountId: 10 }]);
            (receiptDao.getById as jest.Mock).mockRejectedValue(new Error('Not found'));

            const request = { transferIds: [1], receiptId: 999 } as any;
            const result = await controller.bulkEditTransfers(mockUserId, request);

            expect(result.error).toBe('Receipt not found');
        });
    });

    describe('.bulkDeleteTransfers', () => {
        it('should return error when some transfers do not belong to user', async () => {
            (userDao.getById as jest.Mock).mockResolvedValue(makeMockUser([10]));
            (transferDao.findByIds as jest.Mock).mockResolvedValue([
                { id: 1, originAccountId: 10 },
                { id: 2, originAccountId: 99 }, // not user's account
            ]);

            const request = { transferIds: [1, 2] } as any;
            const result = await controller.bulkDeleteTransfers(mockUserId, request);

            expect(result.error).toBeDefined();
            expect(transferDao.bulkDelete).not.toHaveBeenCalled();
        });

        it('should delete transfers and return insertedId count on success', async () => {
            (userDao.getById as jest.Mock).mockResolvedValue(makeMockUser([10, 11]));
            (transferDao.findByIds as jest.Mock).mockResolvedValue([
                { id: 1, originAccountId: 10 },
                { id: 2, originAccountId: 11 },
            ]);
            (transferDao.bulkDelete as jest.Mock).mockResolvedValue(undefined);

            const request = { transferIds: [1, 2] } as any;
            const result = await controller.bulkDeleteTransfers(mockUserId, request);

            expect(transferDao.bulkDelete).toHaveBeenCalledWith([1, 2]);
            expect(result.insertedId).toBe(2);
            expect(result.error).toBeUndefined();
        });
    });
});
