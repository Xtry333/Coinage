import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Equal, Repository, UpdateResult } from 'typeorm';
import { Contractor } from '../entities/Contractor.entity';
import { BaseDao } from './base.dao';

@Injectable()
export class ContractorDao extends BaseDao {
    public constructor(@InjectRepository(Contractor) private readonly contractorRepository: Repository<Contractor>) {
        super();
    }

    public async getById(id: number): Promise<Contractor> {
        const contractor = await this.contractorRepository.findOneBy({ id: Equal(id) });
        return this.validateNotNullById(Contractor.name, id, contractor);
    }

    public async getActive(): Promise<Contractor[]> {
        return await this.contractorRepository.findBy({ isActive: true });
    }

    public async setActive(id: number, value: boolean): Promise<UpdateResult> {
        return await this.contractorRepository.update({ id: Equal(id) }, { isActive: value });
    }

    public async save(contractor: Contractor): Promise<Contractor> {
        return this.contractorRepository.save(contractor);
    }

    public async deleteById(id: number): Promise<DeleteResult> {
        return await this.contractorRepository.delete({ id: Equal(id) });
    }
}
