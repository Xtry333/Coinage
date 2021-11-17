import { Injectable } from '@angular/core';
import { DeleteResult, Equal, getConnection, InsertResult } from 'typeorm';
import { Category } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TotalInMonthByCategory } from '@coinage-app/interfaces';

@Injectable({
    providedIn: 'root',
})
export class CategoryDao {
    async getById(id: number): Promise<Category | undefined> {
        return await getConnection()
            .getRepository(Category)
            .findOne({ where: { id: Equal(id) } });
    }

    async getAll(): Promise<Category[]> {
        return await getConnection()
            .getRepository(Category)
            .find({ order: { name: 'ASC' } });
    }

    async getTotalByCategoryMonth(year: number, month: number | undefined): Promise<TotalInMonthByCategory[]> {
        return await getConnection()
            .createQueryBuilder<TotalInMonthByCategory>(Category, 'Category')
            .select('Category.name', 'categoryName')
            .addSelect('Category.id', 'categoryId')
            .addSelect('Category.parent', 'categoryParentId')
            .addSelect('SUM(Transfer.amount)', 'amount')
            //.from(Category, 'Category')
            .leftJoin(Transfer, 'Transfer', 'Category.id = Transfer.category')
            .where("Category.type = 'OUTCOME'")
            .andWhere('YEAR(Transfer.date) = :year', { year: year })
            .andWhere('(:month IS NULL OR MONTH(Transfer.date) = :month)', { month: month })
            .groupBy('categoryId')
            .getRawMany();
    }

    async insert(category: Category): Promise<InsertResult> {
        return getConnection().getRepository(Category).insert(category);
    }

    async save(category: Category): Promise<Category> {
        return getConnection().getRepository(Category).save(category);
    }

    async deleteById(id: number): Promise<DeleteResult> {
        return await getConnection()
            .getRepository(Category)
            .delete({ id: Equal(id) });
    }
}
