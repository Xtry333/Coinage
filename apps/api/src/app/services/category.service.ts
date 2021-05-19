import { Injectable } from '@angular/core';
import { Equal, getConnection } from 'typeorm';
import { Category } from '../entity/Category.entity';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    async getById(id: number): Promise<Category> {
        return await getConnection()
            .getRepository(Category)
            .findOne({ where: { id: Equal(id) } });
    }

    async getAll(): Promise<Category[]> {
        return await getConnection().getRepository(Category).find();
    }
}
