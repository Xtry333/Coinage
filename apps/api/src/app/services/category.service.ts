import { Injectable } from '@angular/core';
import { Equal, getConnection } from 'typeorm';
import { Category } from '../entity/Category.entity';
import { Transfer } from '../entity/Transfer.entity';
import { TotalInMonthByCategory } from '@coinage-app/interfaces';

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
}
