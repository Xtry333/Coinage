import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, Repository } from 'typeorm';

import { User } from '../entities/User.entity';
import { ItemsWithContainers } from '../entities/views/ItemsWithContainers.view';
import { BaseDao } from './base.dao';
import { Item } from '../entities/Item.entity';

@Injectable()
export class UserDao extends BaseDao {
    public constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(ItemsWithContainers) private readonly itemsRepository: Repository<ItemsWithContainers>,
        private readonly dataSource: DataSource,
    ) {
        super();
    }

    public async getById(id: number): Promise<User> {
        const user = await this.userRepository.findOneBy({ id: Equal(id) });

        console.log('test', await this.testItemView());

        return this.validateNotNullById(User.name, id, user);
    }

    public async getByUsername(username: string): Promise<User> {
        return await this.userRepository.findOneByOrFail({ name: Equal(username) });
    }

    public async getCurrentDbDate(): Promise<Date> {
        const result = await this.dataSource.query('SELECT NOW() as now');
        return new Date(result[0].now);
    }

    public async testItemView(): Promise<ItemsWithContainers[]> {
        const items = await this.dataSource.getRepository(ItemsWithContainers).find({
            order: { itemId: 'ASC' }
        });
        return items;
    }
}
