import { Injectable, Logger } from '@nestjs/common';

import { TransferItemDao } from '../daos/transferItem.dao';
import { TransferItem } from '../entities/TransferItem.entity';
import { ItemPackagingService } from './item-packaging.service';

@Injectable()
export class TransferItemsService {
    public constructor(
        private readonly transferItemDao: TransferItemDao,
        private readonly packagingService: ItemPackagingService,
    ) {}

    public async save(item: TransferItem): Promise<TransferItem> {
        try {
            Logger.log(`Saving transfer item ${item.id}`, 'TransferItemsService');
            let entity: TransferItem;
            const previous = item.id !== undefined ? await this.transferItemDao.getById(item.id) : undefined;
            const packaging = await this.packagingService.resolve(item.itemId, item.packagingId, item.containerId ?? null, previous);
            const containerId = packaging ? packaging.containerId : item.packagingId === null ? null : (item.containerId ?? null);

            // Only a line ID identifies an edit. Repeated purchases of the same
            // product/package/price are separate lines, with their own quantities and discounts.
            entity = previous ?? new TransferItem();

            entity.transferId = item.transferId;
            entity.itemId = item.itemId;
            entity.quantity = item.quantity;
            entity.unitPrice = item.unitPrice;
            entity.totalSetPrice = item.totalSetPrice;
            entity.totalSetDiscount = item.totalSetDiscount;
            entity.containerId = containerId;
            entity.packagingId = packaging?.id ?? null;

            entity = await this.transferItemDao.save(entity);

            return entity;
        } catch (e) {
            Logger.error(e, 'TransferItemsService');
            throw e;
        }
    }

    public removeTransferItemsForTransferId(transferId: number) {
        return this.transferItemDao.removeTransferItemsForTransferId(transferId);
    }

    public async getTransferItems(transferId: number): Promise<TransferItem[]> {
        return await this.transferItemDao.findByTransferId(transferId);
    }

    public async deleteTransferItems(ids: number[]): Promise<number> {
        return await this.transferItemDao.deleteByIds(ids);
    }
}
