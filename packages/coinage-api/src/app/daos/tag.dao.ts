import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

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

    public async getByIds(ids: number[]): Promise<Tag[]> {
        if (!Array.isArray(ids) || ids.some((id) => !Number.isSafeInteger(id) || id < 1)) {
            throw new BadRequestException('Tag IDs must be positive integers.');
        }
        const uniqueIds = [...new Set(ids)];
        if (uniqueIds.length === 0) return [];
        const tags = await this.tagRepository.findBy({ id: In(uniqueIds) });
        return this.validateExactAmountByIds(Tag.name, tags, uniqueIds);
    }

    public async deleteById(id: number) {
        return this.tagRepository.delete(id);
    }
}
