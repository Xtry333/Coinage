import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';
import { Item } from '../entities/Item.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { Writeable } from '../types/Writeable.type';
import { BaseDao } from './base.dao';

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
        return await this.transferItemRepository.save(transferItem);
    }

    public async removeTransferItemsForTransferId(transferId: number): Promise<number> {
        return (await this.transferItemRepository.delete({ transferId: Equal(transferId) })).affected ?? 0;
    }

    public async findUnique(transferId: number, itemId: number, itemPrice: number): Promise<TransferItem | null> {
        const item = await this.transferItemRepository.findOneBy({
            transferId: Equal(transferId),
            itemId: Equal(itemId),
            unitPrice: Equal(itemPrice),
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
}
