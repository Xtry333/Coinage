import { Injectable, Logger } from '@nestjs/common';
import { TransferItemDao } from '../daos/transferItem.dao';
import { TransferItem } from '../entities/TransferItem.entity';

@Injectable()
export class TransferItemsService {
    public constructor(private readonly transferItemDao: TransferItemDao) {}

    public async save(item: TransferItem): Promise<TransferItem> {
        try {
            Logger.log(`Saving transfer item ${item.id}`, 'TransferItemsService');
            let entity: TransferItem;

            if (item.id !== undefined) {
                entity = await this.transferItemDao.getById(item.id);
            } else {
                entity = (await this.transferItemDao.findUnique(item.transferId, item.itemId, item.unitPrice)) ?? new TransferItem();
                Logger.log(`Fetched item ${entity.id}`, 'TransferItemsService');
            }

            entity.transferId = item.transferId;
            entity.itemId = item.itemId;
            entity.quantity = item.quantity;
            entity.unitPrice = item.unitPrice;
            entity.totalSetPrice = item.totalSetPrice;
            entity.totalSetDiscount = item.totalSetDiscount;
            entity.containerId = item.containerId;

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
