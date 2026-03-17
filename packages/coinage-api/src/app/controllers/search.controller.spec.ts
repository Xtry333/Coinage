import { Test, TestingModule } from '@nestjs/testing';

import { GlobalSearchRequest, GlobalSearchResponse } from '@app/interfaces';

import { PartialProvider } from '../../test/partial-provider';
import { AuthService } from '../auth/auth.service';
import { UserDao } from '../daos/user.dao';
import { AuthGuard } from '../services/auth.guard';
import { SearchService } from '../services/search.service';
import { SearchController } from './search.controller';

describe('SearchController', () => {
    let controller: SearchController;
    let searchService: jest.Mocked<Partial<SearchService>>;

    beforeEach(async () => {
        searchService = {
            globalSearch: jest.fn(),
        };

        const authGuardProvider: PartialProvider<AuthGuard> = {
            provide: AuthGuard,
            useValue: { canActivate: jest.fn(() => Promise.resolve(true)) },
        };

        const authServiceProvider: PartialProvider<AuthService> = {
            provide: AuthService,
            useValue: {},
        };

        const userDaoProvider: PartialProvider<UserDao> = {
            provide: UserDao,
            useValue: {},
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [SearchController, authGuardProvider, authServiceProvider, userDaoProvider, { provide: SearchService, useValue: searchService }],
        }).compile();

        controller = module.get(SearchController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('.globalSearch', () => {
        it('should call searchService with query and default limits', async () => {
            const mockResponse = new GlobalSearchResponse([], []);
            (searchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

            const queryParams = { query: 'groceries' } as any;
            const result = await controller.globalSearch(1, queryParams);

            expect(searchService.globalSearch).toHaveBeenCalledWith(1, expect.any(GlobalSearchRequest));
            expect(result).toBe(mockResponse);
        });

        it('should use default limit of 5 when itemsLimit is not provided', async () => {
            (searchService.globalSearch as jest.Mock).mockResolvedValue(new GlobalSearchResponse([], []));

            const queryParams = { query: 'test' } as any;
            await controller.globalSearch(1, queryParams);

            const request: GlobalSearchRequest = (searchService.globalSearch as jest.Mock).mock.calls[0][1];
            expect(request.itemsLimit).toBe(5);
            expect(request.transfersLimit).toBe(5);
        });

        it('should use custom limits when provided', async () => {
            (searchService.globalSearch as jest.Mock).mockResolvedValue(new GlobalSearchResponse([], []));

            const queryParams = { query: 'test', itemsLimit: 10, transfersLimit: 20 } as any;
            await controller.globalSearch(1, queryParams);

            const request: GlobalSearchRequest = (searchService.globalSearch as jest.Mock).mock.calls[0][1];
            expect(request.itemsLimit).toBe(10);
            expect(request.transfersLimit).toBe(20);
        });

        it('should pass userId to searchService', async () => {
            (searchService.globalSearch as jest.Mock).mockResolvedValue(new GlobalSearchResponse([], []));

            const queryParams = { query: 'test' } as any;
            await controller.globalSearch(99, queryParams);

            expect(searchService.globalSearch).toHaveBeenCalledWith(99, expect.any(Object));
        });
    });
});
