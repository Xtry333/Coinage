import { Injectable } from '@nestjs/common';
import { ItemDao } from '../daos/item.dao';
import { Item } from '../entities/Item.entity';

@Injectable()
export class ItemsService {
    public constructor(private readonly itemDao: ItemDao) {}

    public getById(itemId: number): Promise<Item> {
        return this.itemDao.getById(itemId);
    }

    public async getByIds(itemIds: number[]): Promise<Item[]> {
        return this.itemDao.getByIds(itemIds);
    }
}
