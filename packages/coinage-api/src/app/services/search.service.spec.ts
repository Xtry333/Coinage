import 'reflect-metadata';

import { GlobalSearchRequest } from '@app/interfaces';
import { createSpyFromClass, Spy } from 'jest-auto-spies';

import { ItemDao } from '../daos/item.dao';
import { TransferDao } from '../daos/transfer.dao';
import { UserDao } from '../daos/user.dao';
import { SearchService } from './search.service';

describe('SearchService', () => {
    let service: SearchService;
    let itemDao: Spy<ItemDao>;
    let transferDao: Spy<TransferDao>;
    let userDao: Spy<UserDao>;

    function makeMockUser(accountIds: number[]) {
        return {
            id: 1,
            accounts: Promise.resolve(accountIds.map((id) => ({ id }))),
        };
    }

    beforeEach(() => {
        itemDao = createSpyFromClass(ItemDao);
        transferDao = createSpyFromClass(TransferDao);
        userDao = createSpyFromClass(UserDao);
        service = new SearchService(itemDao, transferDao, userDao);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('.globalSearch', () => {
        it('should return empty results when nothing is found', async () => {
            userDao.getById.mockResolvedValue(makeMockUser([]) as any);
            itemDao.searchByNameOrBrand.mockResolvedValue([]);
            transferDao.searchByDescription.mockResolvedValue([]);

            const request = new GlobalSearchRequest('test', 5, 5);
            const result = await service.globalSearch(1, request);

            expect(result.items).toEqual([]);
            expect(result.transfers).toEqual([]);
        });

        it('should pass user account IDs to transfer search', async () => {
            userDao.getById.mockResolvedValue(makeMockUser([101, 102]) as any);
            itemDao.searchByNameOrBrand.mockResolvedValue([]);
            transferDao.searchByDescription.mockResolvedValue([]);

            const request = new GlobalSearchRequest('query', 5, 5);
            await service.globalSearch(1, request);

            expect(transferDao.searchByDescription).toHaveBeenCalledWith('query', [101, 102], 5);
        });

        it('should pass query and limit to item search', async () => {
            userDao.getById.mockResolvedValue(makeMockUser([]) as any);
            itemDao.searchByNameOrBrand.mockResolvedValue([]);
            transferDao.searchByDescription.mockResolvedValue([]);

            const request = new GlobalSearchRequest('milk', 10, 5);
            await service.globalSearch(1, request);

            expect(itemDao.searchByNameOrBrand).toHaveBeenCalledWith('milk', 10);
        });

        it('should map items with category name', async () => {
            userDao.getById.mockResolvedValue(makeMockUser([]) as any);
            const mockItem = {
                id: 10,
                name: 'Milk',
                brand: 'Dairy Farm',
                category: Promise.resolve({ name: 'Groceries' }),
            };
            itemDao.searchByNameOrBrand.mockResolvedValue([mockItem] as any);
            transferDao.searchByDescription.mockResolvedValue([]);

            const result = await service.globalSearch(1, new GlobalSearchRequest('Milk', 5, 5));

            expect(result.items).toHaveLength(1);
            expect(result.items[0].id).toBe(10);
            expect(result.items[0].name).toBe('Milk');
            expect(result.items[0].brand).toBe('Dairy Farm');
            expect(result.items[0].categoryName).toBe('Groceries');
        });

        it('should set categoryName to null when item has no category', async () => {
            userDao.getById.mockResolvedValue(makeMockUser([]) as any);
            const mockItem = {
                id: 10,
                name: 'Uncategorized',
                brand: null,
                category: Promise.resolve(null),
            };
            itemDao.searchByNameOrBrand.mockResolvedValue([mockItem] as any);
            transferDao.searchByDescription.mockResolvedValue([]);

            const result = await service.globalSearch(1, new GlobalSearchRequest('Uncategorized', 5, 5));

            expect(result.items[0].categoryName).toBeNull();
        });

        it('should map transfers with all fields', async () => {
            userDao.getById.mockResolvedValue(makeMockUser([1]) as any);
            itemDao.searchByNameOrBrand.mockResolvedValue([]);
            const mockDate = new Date('2024-01-15');
            const mockTransfer = {
                id: 20,
                description: 'Grocery shopping',
                amount: 55.5,
                currency: { symbol: 'PLN' },
                date: mockDate,
                category: { name: 'Food' },
                contractor: { name: 'Lidl' },
            };
            transferDao.searchByDescription.mockResolvedValue([mockTransfer] as any);

            const result = await service.globalSearch(1, new GlobalSearchRequest('Grocery', 5, 5));

            expect(result.transfers).toHaveLength(1);
            expect(result.transfers[0].id).toBe(20);
            expect(result.transfers[0].description).toBe('Grocery shopping');
            expect(result.transfers[0].amount).toBe(55.5);
            expect(result.transfers[0].currencySymbol).toBe('PLN');
            expect(result.transfers[0].categoryName).toBe('Food');
            expect(result.transfers[0].contractorName).toBe('Lidl');
        });

        it('should set contractorName to null when transfer has no contractor', async () => {
            userDao.getById.mockResolvedValue(makeMockUser([1]) as any);
            itemDao.searchByNameOrBrand.mockResolvedValue([]);
            const mockTransfer = {
                id: 20,
                description: 'Test',
                amount: 10,
                currency: { symbol: 'PLN' },
                date: new Date(),
                category: { name: 'Food' },
                contractor: null,
            };
            transferDao.searchByDescription.mockResolvedValue([mockTransfer] as any);

            const result = await service.globalSearch(1, new GlobalSearchRequest('Test', 5, 5));

            expect(result.transfers[0].contractorName).toBeNull();
        });

        it('should use userId to fetch user from DAO', async () => {
            userDao.getById.mockResolvedValue(makeMockUser([]) as any);
            itemDao.searchByNameOrBrand.mockResolvedValue([]);
            transferDao.searchByDescription.mockResolvedValue([]);

            await service.globalSearch(42, new GlobalSearchRequest('q', 5, 5));

            expect(userDao.getById).toHaveBeenCalledWith(42);
        });
    });
});
