import { GlobalSearchItemResult, GlobalSearchRequest, GlobalSearchResponse, GlobalSearchTransferResult } from '@app/interfaces';
import { Injectable } from '@nestjs/common';
import { ItemDao } from '../daos/item.dao';
import { TransferDao } from '../daos/transfer.dao';
import { UserDao } from '../daos/user.dao';

@Injectable()
export class SearchService {
    public constructor(
        private readonly itemDao: ItemDao,
        private readonly transferDao: TransferDao,
        private readonly userDao: UserDao,
    ) {}

    public async globalSearch(userId: number, request: GlobalSearchRequest): Promise<GlobalSearchResponse> {
        const user = await this.userDao.getById(userId);
        const userAccountIds = (await user.accounts).map((a) => a.id);

        const [items, transfers] = await Promise.all([
            this.searchItems(request.query, request.itemsLimit || 5),
            this.searchTransfers(request.query, userAccountIds, request.transfersLimit || 5),
        ]);

        return new GlobalSearchResponse(items, transfers);
    }

    private async searchItems(query: string, limit: number): Promise<GlobalSearchItemResult[]> {
        const items = await this.itemDao.searchByNameOrBrand(query, limit);

        return Promise.all(
            items.map(async (item) => {
                const category = await item.category;
                return new GlobalSearchItemResult(item.id, item.name, item.brand, category?.name || null);
            }),
        );
    }

    private async searchTransfers(query: string, userAccountIds: number[], limit: number): Promise<GlobalSearchTransferResult[]> {
        const transfers = await this.transferDao.searchByDescription(query, userAccountIds, limit);

        return transfers.map(
            (transfer) =>
                new GlobalSearchTransferResult(
                    transfer.id,
                    transfer.description,
                    transfer.amount,
                    transfer.currency.symbol,
                    transfer.date,
                    transfer.category.name,
                    transfer.contractor?.name || null,
                ),
        );
    }
}
