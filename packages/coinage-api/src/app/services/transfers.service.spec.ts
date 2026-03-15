import { TransferTypeEnum } from '@app/interfaces';
import { createSpyFromClass, Spy } from 'jest-auto-spies';

import { CategoryDao } from '../daos/category.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Category } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransfersService } from './transfers.service';

function createMockCategory(id: number, name: string): Category {
    const cat = new Category();
    cat.id = id;
    cat.name = name;
    return cat;
}

function createMockTransfer(overrides: Partial<Transfer> = {}): Transfer {
    const transfer = new Transfer();
    transfer.id = 1;
    transfer.description = 'Test transfer';
    transfer.amount = 100;
    transfer.currency = { symbol: 'PLN' } as any;
    transfer.category = { id: 10, name: 'Food' } as any;
    transfer.categoryId = 10;
    transfer.originAccountId = 5;
    transfer.originAccount = { id: 5, name: 'Main Account', userId: 1, currency: { symbol: 'PLN' } } as any;
    transfer.targetAccount = undefined as any;
    transfer.ownerUserId = 1;
    transfer.contractor = null as any;
    transfer.receiptId = null as any;
    transfer.isFlagged = false;
    transfer.date = new Date('2024-01-01');
    return Object.assign(transfer, overrides);
}

describe('TransfersService', () => {
    let service: TransfersService;
    let transferDao: Spy<TransferDao>;
    let categoryDao: Spy<CategoryDao>;

    beforeEach(() => {
        transferDao = createSpyFromClass(TransferDao);
        categoryDao = createSpyFromClass(CategoryDao);
        service = new TransfersService(transferDao, categoryDao);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('.getAllFilteredPagedDTO', () => {
        it('should call DAO and return mapped DTOs', async () => {
            const mockTransfer = createMockTransfer();
            transferDao.getAllFilteredPaged.mockResolvedValue([mockTransfer]);

            const filter = { page: 1, rowsPerPage: 10 } as any;
            const result = await service.getAllFilteredPagedDTO(filter);

            expect(transferDao.getAllFilteredPaged).toHaveBeenCalledWith(filter);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
            expect(result[0].description).toBe('Test transfer');
            expect(result[0].amount).toBe(100);
            expect(result[0].currency).toBe('PLN');
        });

        it('should return empty array when DAO returns no transfers', async () => {
            transferDao.getAllFilteredPaged.mockResolvedValue([]);
            const result = await service.getAllFilteredPagedDTO({} as any);
            expect(result).toEqual([]);
        });
    });

    describe('.getAllFilteredCount', () => {
        it('should delegate to DAO and return count', async () => {
            transferDao.getAllFilteredCount.mockResolvedValue(42);
            const filter = { page: 1, rowsPerPage: 10 } as any;

            const result = await service.getAllFilteredCount(filter);

            expect(transferDao.getAllFilteredCount).toHaveBeenCalledWith(filter);
            expect(result).toBe(42);
        });
    });

    describe('.getRecentTransfersForUserDTO', () => {
        it('should return mapped DTOs for recent transfers', async () => {
            const mockTransfer = createMockTransfer();
            transferDao.getRecentlyEditedTransfersForUser.mockResolvedValue([mockTransfer]);

            const result = await service.getRecentTransfersForUserDTO(1, 10);

            expect(transferDao.getRecentlyEditedTransfersForUser).toHaveBeenCalledWith(1, 10);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
        });
    });

    describe('.saveTransfer', () => {
        it('should save transfer and return saved entity', async () => {
            const mockCategory = createMockCategory(10, 'Food');
            const mockTransfer = createMockTransfer({ description: 'My expense' });
            const savedTransfer = createMockTransfer({ description: 'My expense' });

            categoryDao.getById.mockResolvedValue(mockCategory);
            transferDao.save.mockResolvedValue(savedTransfer);

            const result = await service.saveTransfer(mockTransfer);

            expect(categoryDao.getById).toHaveBeenCalledWith(10);
            expect(mockTransfer.description).toBe('My expense');
            expect(transferDao.save).toHaveBeenCalledWith(mockTransfer);
            expect(result).toBe(savedTransfer);
        });

        it('should set description from category name when description is empty', async () => {
            const mockCategory = createMockCategory(10, 'Food');
            const mockTransfer = createMockTransfer({ description: '' });

            categoryDao.getById.mockResolvedValue(mockCategory);
            transferDao.save.mockResolvedValue(mockTransfer);

            await service.saveTransfer(mockTransfer);

            expect(mockTransfer.description).toBe('Food');
        });

        it('should throw when category is not found', async () => {
            const mockTransfer = createMockTransfer();
            categoryDao.getById.mockResolvedValue(null);

            await expect(service.saveTransfer(mockTransfer)).rejects.toThrow('Category not found');
            expect(transferDao.save).not.toHaveBeenCalled();
        });

        it('should use category.id when categoryId is not set on transfer', async () => {
            const mockCategory = createMockCategory(10, 'Food');
            const mockTransfer = createMockTransfer({ categoryId: null as any });
            mockTransfer.category = { id: 10, name: 'Food' } as any;

            categoryDao.getById.mockResolvedValue(mockCategory);
            transferDao.save.mockResolvedValue(mockTransfer);

            await service.saveTransfer(mockTransfer);

            expect(categoryDao.getById).toHaveBeenCalledWith(10);
        });
    });

    describe('transfer type determination (via getAllFilteredPagedDTO)', () => {
        it('should set type INTERNAL when origin and target accounts have same userId', async () => {
            const mockTransfer = createMockTransfer({
                originAccount: { id: 5, name: 'Account A', userId: 1, currency: { symbol: 'PLN' } } as any,
                targetAccount: { id: 6, userId: 1 } as any,
                ownerUserId: 1,
            });
            transferDao.getAllFilteredPaged.mockResolvedValue([mockTransfer]);

            const [dto] = await service.getAllFilteredPagedDTO({} as any);

            expect(dto.type).toBe(TransferTypeEnum.INTERNAL);
        });

        it('should set type OUTCOME when originAccount.userId equals ownerUserId and no target', async () => {
            const mockTransfer = createMockTransfer({
                originAccount: { id: 5, name: 'Account', userId: 1, currency: { symbol: 'PLN' } } as any,
                targetAccount: undefined as any,
                ownerUserId: 1,
            });
            transferDao.getAllFilteredPaged.mockResolvedValue([mockTransfer]);

            const [dto] = await service.getAllFilteredPagedDTO({} as any);

            expect(dto.type).toBe(TransferTypeEnum.OUTCOME);
        });

        it('should set type INCOME when originAccount.userId does not equal ownerUserId', async () => {
            const mockTransfer = createMockTransfer({
                originAccount: { id: 5, name: 'Account', userId: 2, currency: { symbol: 'PLN' } } as any,
                targetAccount: undefined as any,
                ownerUserId: 1,
            });
            transferDao.getAllFilteredPaged.mockResolvedValue([mockTransfer]);

            const [dto] = await service.getAllFilteredPagedDTO({} as any);

            expect(dto.type).toBe(TransferTypeEnum.INCOME);
        });
    });

    describe('DTO mapping (via getAllFilteredPagedDTO)', () => {
        it('should set contractor fields to null when contractor is null', async () => {
            const mockTransfer = createMockTransfer({ contractor: null as any });
            transferDao.getAllFilteredPaged.mockResolvedValue([mockTransfer]);

            const [dto] = await service.getAllFilteredPagedDTO({} as any);

            expect(dto.contractorId).toBeNull();
            expect(dto.contractorName).toBeNull();
        });

        it('should map contractor fields when contractor exists', async () => {
            const mockTransfer = createMockTransfer({
                contractor: { id: 7, name: 'Contractor Corp' } as any,
            });
            transferDao.getAllFilteredPaged.mockResolvedValue([mockTransfer]);

            const [dto] = await service.getAllFilteredPagedDTO({} as any);

            expect(dto.contractorId).toBe(7);
            expect(dto.contractorName).toBe('Contractor Corp');
        });

        it('should format accountName with currency in brackets', async () => {
            const mockTransfer = createMockTransfer({
                originAccount: { id: 5, name: 'Main Account', userId: 1, currency: { symbol: 'PLN' } } as any,
                currency: { symbol: 'PLN' } as any,
            });
            transferDao.getAllFilteredPaged.mockResolvedValue([mockTransfer]);

            const [dto] = await service.getAllFilteredPagedDTO({} as any);

            expect(dto.accountName).toBe('Main Account [PLN]');
        });

        it('should set receiptId to null when transfer has no receipt', async () => {
            const mockTransfer = createMockTransfer({ receiptId: null as any });
            transferDao.getAllFilteredPaged.mockResolvedValue([mockTransfer]);

            const [dto] = await service.getAllFilteredPagedDTO({} as any);

            expect(dto.receiptId).toBeNull();
        });
    });
});
