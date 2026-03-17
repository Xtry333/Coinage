import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Tag } from '../entities/Tag.entity';
import { BaseDao } from './base.dao';

@Injectable()
export class TagDao extends BaseDao {
    public constructor(@InjectRepository(Tag) private readonly tagRepository: Repository<Tag>) {
        super();
    }

    public async getAll(): Promise<Tag[]> {
        return this.tagRepository.find({ order: { name: 'ASC' } });
    }

    public async getById(id: number): Promise<Tag> {
        const tag = await this.tagRepository.findOneBy({ id: Equal(id) });
        return this.validateNotNullById(Tag.name, id, tag);
    }

    public async save(tag: Tag): Promise<Tag> {
        return this.tagRepository.save(tag);
    }

    public async deleteById(id: number) {
        return this.tagRepository.delete(id);
    }
}
