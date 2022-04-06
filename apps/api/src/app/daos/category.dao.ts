import { DeleteResult, Equal, InsertResult, getConnection, Repository } from 'typeorm';

import { Account } from '../entities/Account.entity';
import { Category } from '../entities/Category.entity';
import { Injectable } from '@nestjs/common';
import { TotalInMonthByCategory } from '@coinage-app/interfaces';
import { Transfer } from '../entities/Transfer.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CategoryDao {
    constructor(@InjectRepository(Category) private readonly categoryRepository: Repository<Category>) {}

    async getById(id: number): Promise<Category | undefined> {
        return await getConnection()
            .getRepository(Category)
            .findOne({ where: { id: Equal(id) } });
    }

    async getBySystemTag(tag: string): Promise<Category> {
        const category = await getConnection()
            .getRepository(Category)
            .findOne({ where: { tag: Equal(tag) } });
        if (!category) {
            throw new Error('System category not found. Something went wrong in the database.');
        }
        return category;
    }

    async getAll(): Promise<Category[]> {
        return await getConnection()
            .getRepository(Category)
            .find({ order: { name: 'ASC' } });
    }

    async getTotalByCategoryMonth(year: number, month?: number, day?: number): Promise<TotalInMonthByCategory[]> {
        return await getConnection()
            .createQueryBuilder<TotalInMonthByCategory>(Category, 'Category')
            .select('Category.name', 'categoryName')
            .addSelect('Category.id', 'categoryId')
            .addSelect('Category.parent', 'categoryParentId')
            .addSelect('SUM(Transfer.amount)', 'amount')
            .addSelect('COUNT(Transfer.id)', 'numberOfTransfers')
            // .from(Category, 'Category')
            .leftJoin(Transfer, 'Transfer', 'Category.id = Transfer.category')
            .leftJoin(Account, 'Account', 'Account.id = Transfer.account')
            .where("Category.type = 'OUTCOME'")
            .andWhere('YEAR(Transfer.date) = :year', { year })
            .andWhere('(:month IS NULL OR MONTH(Transfer.date) = :month)', { month })
            .andWhere('(:day IS NULL OR DAY(Transfer.date) = :day)', { day })
            .andWhere('Account.userId = :userId', { userId: 1 })
            // .andWhere('Transfer.isInternalBuffer = false')
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
        const category = await this.categoryRepository.findOne({ where: { id: Equal(id) } });
        if (category) {
            if (category.tag) {
                throw new Error('Cannot delete system category');
            }
            return this.categoryRepository.delete({ id: Equal(id) });
        }
        throw new Error('Category not found');
    }
}
