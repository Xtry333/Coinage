import { ItemWithLastUsedPriceDTO } from '@coinage-app/interfaces';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { Item } from '../entities/Item.entity';
import { BaseDao } from './base.dao';

interface ItemWithLastUsedPriceDBObject {
    id: number;
    brand: string;
    name: string;
    last_unit_price: number | null;
    last_used_date: Date | null;
    category_id: number;
    container_size: number | null;
    container_size_unit: string | null;
}

@Injectable()
export class ItemDao extends BaseDao {
    public constructor(@InjectRepository(Item) private readonly itemRepository: Repository<Item>) {
        super();
    }

    public async getAll(): Promise<Item[]> {
        return await this.itemRepository.find();
    }

    public async getAllWithLastUsedPrice(): Promise<ItemWithLastUsedPriceDTO[]> {
        const result: ItemWithLastUsedPriceDBObject[] = await this.itemRepository.query(`
            WITH latest_transfer_item AS (
                SELECT ti.*, t.date AS date, ROW_NUMBER() OVER (PARTITION BY ti.item_id ORDER BY t.date DESC) AS rn
                FROM transfer_item AS ti
                JOIN transfer AS t ON t.id = ti.transfer_id
            )
            SELECT i.*, lti.date AS last_used_date, lti.unit_price AS last_unit_price
            FROM item i
            LEFT JOIN latest_transfer_item lti ON i.id = lti.item_id AND rn = 1
            ORDER BY i.name;
          `);
        return result.map(
            (item) => new ItemWithLastUsedPriceDTO(item.id, this.formatItemName(item), item.last_used_date, item.last_unit_price ?? 0, item.category_id)
        );
    }

    private formatItemName(item: ItemWithLastUsedPriceDBObject): string {
        return `${item.brand ?? ''} ${item.name} ${item.container_size ?? ''}${item.container_size ? item.container_size_unit : ''}`.trim();
    }

    public save(entity: Item): Promise<Item> {
        return this.itemRepository.save(entity);
    }

    public async getById(id: number): Promise<Item> {
        const item = await this.itemRepository.findOneBy({ id: Equal(id) });

        return this.validateNotNullById(Item.name, id, item);
    }
}
