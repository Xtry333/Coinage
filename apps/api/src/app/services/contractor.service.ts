import { Injectable } from '@angular/core';
import { DeleteResult, Equal, getConnection } from 'typeorm';
import { Contractor } from '../entity/Contractor.entity';

@Injectable({
    providedIn: 'root',
})
export class ContractorService {
    async getById(id: number): Promise<Contractor | undefined> {
        return await getConnection()
            .getRepository(Contractor)
            .findOne({ where: { id: Equal(id) } });
    }

    async getAll(): Promise<Contractor[]> {
        return await getConnection().getRepository(Contractor).find();
    }

    async save(contractor: Contractor): Promise<Contractor> {
        return getConnection().getRepository(Contractor).save(contractor);
    }

    async deleteById(id: number): Promise<DeleteResult> {
        return await getConnection()
            .getRepository(Contractor)
            .delete({ id: Equal(id) });
    }
}
