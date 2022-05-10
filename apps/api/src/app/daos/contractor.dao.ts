import { Injectable } from '@nestjs/common';
import { DeleteResult, Equal, getConnection } from 'typeorm';
import { Contractor } from '../entities/Contractor.entity';

@Injectable()
export class ContractorDao {
    public async getById(id: number): Promise<Contractor | null> {
        return await getConnection()
            .getRepository(Contractor)
            .findOne({ where: { id: Equal(id) } });
    }

    public async getAll(): Promise<Contractor[]> {
        return await getConnection().getRepository(Contractor).find();
    }

    public async save(contractor: Contractor): Promise<Contractor> {
        return getConnection().getRepository(Contractor).save(contractor);
    }

    public async deleteById(id: number): Promise<DeleteResult> {
        return await getConnection()
            .getRepository(Contractor)
            .delete({ id: Equal(id) });
    }
}
