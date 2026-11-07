import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { CategoryDao } from '../daos/category.dao';
import { ItemDao } from '../daos/item.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { AccountsService } from '../services/accounts/accounts.service';
import { AuthGuard } from '../services/auth.guard';
import controllers from './_index';

describe('Express 5 route compatibility', () => {
    let app: INestApplication;
    let baseUrl: string;

    const accounts = [{ id: 1, name: 'Main account' }];
    const items = [{ id: 2, name: 'Milk' }];
    const receipts = [{ id: 3, description: 'Groceries', amount: 10 }];
    const totals = [{ categoryId: 4, total: 10 }];
    const accountsService = { getForUserId: jest.fn().mockResolvedValue(accounts) };
    const itemDao = { getAllWithLastUsedPrice: jest.fn().mockResolvedValue(items) };
    const receiptDao = { getAll: jest.fn().mockResolvedValue(receipts) };
    const categoryDao = { getTotalByCategoryMonth: jest.fn().mockResolvedValue(totals) };
    const canActivate = jest.fn((context: ExecutionContext) => {
        context.switchToHttp().getRequest().user = { id: 10 };
        return true;
    });

    beforeAll(async () => {
        // Register the same controller list as AppModule, but never initialize database or background services.
        const module = await Test.createTestingModule({ controllers })
            .useMocker((token) => {
                if (token === AccountsService) return accountsService;
                if (token === ItemDao) return itemDao;
                if (token === ReceiptDao) return receiptDao;
                if (token === CategoryDao) return categoryDao;
                return {};
            })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate })
            .compile();

        app = module.createNestApplication({ logger: false });
        app.setGlobalPrefix('api');
        await app.listen(0, '127.0.0.1');
        baseUrl = await app.getUrl();
    });

    beforeEach(() => jest.clearAllMocks());

    afterAll(async () => {
        await app?.close();
    });

    it('registers every API controller without unsupported route syntax', () => {
        expect(app.getHttpServer().listening).toBe(true);
    });

    it.each(['account', 'accounts'])('serves /api/%s/all', async (path) => {
        const response = await fetch(`${baseUrl}/api/${path}/all`);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(accounts);
        expect(accountsService.getForUserId).toHaveBeenCalledWith(10);
    });

    it.each(['item', 'items'])('serves /api/%s/all', async (path) => {
        const response = await fetch(`${baseUrl}/api/${path}/all`);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(items);
        expect(itemDao.getAllWithLastUsedPrice).toHaveBeenCalledTimes(1);
    });

    it.each(['receipt', 'receipts'])('serves /api/%s/all', async (path) => {
        const response = await fetch(`${baseUrl}/api/${path}/all`);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([{ ...receipts[0], transferIds: [] }]);
        expect(receiptDao.getAll).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['/api/category/totalPerCategory/2026/11', undefined],
        ['/api/category/totalPerCategory/2026/11/7', 7],
    ])('preserves the optional day in %s', async (path, day) => {
        const response = await fetch(`${baseUrl}${path}`);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(totals);
        expect(categoryDao.getTotalByCategoryMonth).toHaveBeenCalledWith(2026, 11, day, 10);
    });

    it.each(['accountss', 'itemss', 'receiptss'])('does not match /api/%s/all', async (path) => {
        const response = await fetch(`${baseUrl}/api/${path}/all`);

        expect(response.status).toBe(404);
    });

    it.each(['account', 'accounts'])('still applies the authentication guard to /api/%s/all', async (path) => {
        canActivate.mockReturnValueOnce(false);

        const response = await fetch(`${baseUrl}/api/${path}/all`);

        expect(response.status).toBe(403);
        expect(accountsService.getForUserId).not.toHaveBeenCalled();
    });
});
