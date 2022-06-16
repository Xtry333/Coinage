import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';
import { Item } from '../entities/Item.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { Writeable } from '../types/Writeable.type';
import { BaseDao } from './base.bao';

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
}
