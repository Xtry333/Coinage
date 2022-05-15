import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { Item } from '../entities/Item.entity';
import { BaseDao } from './base.bao';

@Injectable()
export class ItemDao extends BaseDao {
    public constructor(@InjectRepository(Item) private readonly itemRepository: Repository<Item>) {
        super();
    }
    public async getAll(): Promise<Item[]> {
        return await this.itemRepository.find();
    }

    public async getById(id: number): Promise<Item> {
        const item = await this.itemRepository.findOneBy({ id: Equal(id) });

        return this.validateNotNullById(Item.name, id, item);
    }
}
