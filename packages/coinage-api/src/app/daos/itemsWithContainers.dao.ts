import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ItemsWithContainers } from '../entities/views/ItemsWithContainers.view';
import { BaseDao } from './base.dao';

@Injectable()
export class ItemsWithContainersDao extends BaseDao {
    public constructor(@InjectRepository(ItemsWithContainers) private readonly itemsWithContainersRepository: Repository<ItemsWithContainers>) {
        super();
    }

    public async getContainersUsedWithItem(itemId: number): Promise<ItemsWithContainers[]> {
        return this.itemsWithContainersRepository.find({
            where: { itemId },
            order: { containerName: 'ASC' },
        });
    }

    public async getItemsInContainer(containerId: number): Promise<ItemsWithContainers[]> {
        return this.itemsWithContainersRepository.find({
            where: { containerId },
            order: { itemName: 'ASC' },
        });
    }

    public async getAllItemContainerPairs(): Promise<ItemsWithContainers[]> {
        return this.itemsWithContainersRepository.find({
            order: { itemName: 'ASC', containerName: 'ASC' },
        });
    }
}
