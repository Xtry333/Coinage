import { Injectable } from '@angular/core';
import { Equal, getConnection } from 'typeorm';
import { Contractor } from '../entity/Contractor.entity';

@Injectable({
    providedIn: 'root',
})
export class ContractorService {
    async getById(id: number): Promise<Contractor> {
        return await getConnection()
            .getRepository(Contractor)
            .findOne({ where: { id: Equal(id) } });
    }

    async getAll(): Promise<Contractor[]> {
        return await getConnection().getRepository(Contractor).find();
    }
}
