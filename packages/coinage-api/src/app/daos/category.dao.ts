import { TotalInMonthByCategory } from '@coinage-app/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Equal, InsertResult, Repository } from 'typeorm';
import { Account } from '../entities/Account.entity';
import { Category } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';
import { BaseDao } from './base.dao';

@Injectable()
export class CategoryDao extends BaseDao {
    public static SYSTEM_CATEGORY_NOT_FOUND_MESSAGE = (tag: string) => `System category '${tag}' not found. Something went wrong in the database.`;

    public constructor(
        @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
        private readonly dataSource: DataSource,
    ) {
        super();
    }

    public async getById(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOneBy({ id: Equal(id) });

        return this.validateNotNullById(Category.name, id, category);
    }

    public async getBySystemTag(tag: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({ where: { tag: Equal(tag) } });
        if (!category) {
            throw new NotFoundException(CategoryDao.SYSTEM_CATEGORY_NOT_FOUND_MESSAGE(tag));
        }
        return category;
    }

    public async getAll(): Promise<Category[]> {
        return await this.categoryRepository.find({ order: { name: 'ASC' } });
    }

    public async getTotalByCategoryMonth(year: number, month?: number, day?: number): Promise<TotalInMonthByCategory[]> {
        return await this.dataSource
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

    public async insert(category: Category): Promise<InsertResult> {
        return this.categoryRepository.insert(category);
    }

    public async save(category: Category): Promise<Category> {
        return this.categoryRepository.save(category);
    }

    public async deleteById(id: number): Promise<DeleteResult> {
        const category = await this.getById(id);

        if (category.tag) {
            throw new Error('Cannot delete system category');
        }

        return this.categoryRepository.delete({ id: Equal(id) });
    }
}
