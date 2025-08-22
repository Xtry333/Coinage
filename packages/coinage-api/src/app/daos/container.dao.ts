import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Container } from '../entities/Container.entity';
import { BaseDao } from './base.dao';

@Injectable()
export class ContainerDao extends BaseDao {
    public constructor(@InjectRepository(Container) private readonly containerRepository: Repository<Container>) {
        super();
    }

    public async getById(id: number): Promise<Container> {
        const container = await this.containerRepository.findOneBy({ id: Equal(id) });
        return this.validateNotNullById(Container.name, id, container);
    }

    public async getAllContainers(): Promise<Container[]> {
        return this.containerRepository.find({
            order: { name: 'ASC' },
        });
    }

    public async findByName(name: string): Promise<Container | null> {
        return this.containerRepository.findOne({
            where: { name },
        });
    }

    public async save(container: Container): Promise<Container> {
        return this.containerRepository.save(container);
    }

    public async remove(container: Container): Promise<Container> {
        return this.containerRepository.remove(container);
    }
}
