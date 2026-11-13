import { TotalInMonthByCategory } from '@app/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Equal, InsertResult, Repository } from 'typeorm';
import { Account } from '../entities/Account.entity';
import { Category, TransferTypeEnum } from '../entities/Category.entity';
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

    public async getTotalByCategoryMonth(year: number, month: number | undefined, day: number | undefined, userId: number): Promise<TotalInMonthByCategory[]> {
        const query = this.dataSource
            .createQueryBuilder<TotalInMonthByCategory>(Category, 'category')
            .select('category.name', 'categoryName')
            .addSelect('category.id', 'categoryId')
            .addSelect('category.parentId', 'categoryParentId')
            .addSelect('SUM(transfer.amount)', 'amount')
            .addSelect('COUNT(transfer.id)', 'numberOfTransfers')
            .leftJoin(Transfer, 'transfer', 'category.id = transfer.category_id')
            .leftJoin(Account, 'account', 'account.id = transfer.account_id')
            .where('category.type = :type', { type: TransferTypeEnum.OUTCOME })
            .andWhere('EXTRACT(YEAR FROM transfer.date) = :year', { year })
            .andWhere('account.userId = :userId', { userId });

        if (month !== undefined) query.andWhere('EXTRACT(MONTH FROM transfer.date) = :month', { month });
        if (day !== undefined) query.andWhere('EXTRACT(DAY FROM transfer.date) = :day', { day });

        return query.groupBy('category.id').getRawMany();
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
