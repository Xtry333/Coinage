import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, IsNull, Repository } from 'typeorm';

import { BaseDao } from './base.dao';
import { Item } from '../entities/Item.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { Writeable } from '../types/Writeable.type';

@Injectable()
export class TransferItemDao extends BaseDao {
    public constructor(@InjectRepository(TransferItem) private readonly transferItemRepository: Repository<TransferItem>) {
        super();
    }
    public async getAll(): Promise<TransferItem[]> {
        return await this.transferItemRepository.find();
    }

    public async getById(id: number): Promise<TransferItem> {
        const item = await this.transferItemRepository.findOneBy({ id: Equal(id) });

        return this.validateNotNullById(Item.name, id, item);
    }

    public async save(transferItem: Writeable<TransferItem>): Promise<TransferItem> {
        // Loaded relations can override changed foreign keys during TypeORM save.
        // Persist only column values so the requested container (including null) wins.
        return await this.transferItemRepository.save({
            id: transferItem.id,
            transferId: transferItem.transferId,
            itemId: transferItem.itemId,
            containerId: transferItem.containerId,
            packagingId: transferItem.packagingId ?? null,
            quantity: transferItem.quantity,
            unitPrice: transferItem.unitPrice,
            totalSetPrice: transferItem.totalSetPrice,
            totalSetDiscount: transferItem.totalSetDiscount,
        });
    }

    public async removeTransferItemsForTransferId(transferId: number): Promise<number> {
        return (await this.transferItemRepository.delete({ transferId: Equal(transferId) })).affected ?? 0;
    }

    public async findUnique(
        transferId: number,
        itemId: number,
        itemPrice: number,
        containerId: number | null,
        packagingId: number | null = null,
    ): Promise<TransferItem | null> {
        const item = await this.transferItemRepository.findOneBy({
            transferId: Equal(transferId),
            itemId: Equal(itemId),
            unitPrice: Equal(itemPrice),
            containerId: containerId === null ? IsNull() : Equal(containerId),
            packagingId: packagingId === null ? IsNull() : Equal(packagingId),
        });
        return item;
    }

    public async findByItemId(itemId: number): Promise<TransferItem[]> {
        const item = await this.transferItemRepository.find({
            where: { itemId: Equal(itemId) },
            relations: {
                transfer: true,
            },
            order: {
                transfer: {
                    date: 'DESC',
                },
            },
        });
        return item;
    }

    public async findByTransferId(transferId: number): Promise<TransferItem[]> {
        return await this.transferItemRepository.find({
            where: { transferId: Equal(transferId) },
            relations: {
                item: true,
                container: true,
            },
        });
    }

    public async deleteByIds(ids: number[]): Promise<number> {
        if (ids.length === 0) return 0;
        return (await this.transferItemRepository.delete({ id: In(ids) })).affected ?? 0;
    }

    public async findAllWithItemAndContainer(): Promise<TransferItem[]> {
        return await this.transferItemRepository.find({
            relations: {
                item: {
                    category: true,
                },
                container: true,
                transfer: {
                    currency: true,
                    originAccount: true,
                    targetAccount: true,
                },
            },
            order: {
                transfer: {
                    createdDate: 'DESC',
                },
            },
        });
    }
}
