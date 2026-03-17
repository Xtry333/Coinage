import { Injectable } from '@nestjs/common';
import { CategoryDao } from '../daos/category.dao';
import { Category } from '../entities/Category.entity';

@Injectable()
export class CategoryCascadeService {
    public constructor(private readonly categoryDao: CategoryDao) {}

    public async canSetCategoryParentById(categoryId: number, newParentId: number | null): Promise<boolean> {
        const categories = await this.categoryDao.getAll();

        const category = categories.find((c) => c.id === categoryId);
        const newParent = categories.find((c) => c.id === newParentId);

        if (category !== undefined && newParentId === null) {
            return true;
        } else if (category === undefined || newParent === undefined) {
            throw new Error('Category not found');
        }

        if (newParentId === categoryId) {
            return false;
        }

        let parentId: number | null = newParent.parentId ?? null;
        while (parentId !== null) {
            if (parentId === categoryId) {
                return false;
            }
            const parent = categories.find((c) => c.id === parentId);
            parentId = parent?.parentId ?? null;
        }

        return true;
    }

    public async setCategoryParentById(category: Category, newParentId: number | null): Promise<boolean> {
        const categories = await this.categoryDao.getAll();

        const newParent = categories.find((c) => c.id === newParentId);

        if (category !== undefined && newParentId === null) {
            category.parentId = newParentId;
            await this.categoryDao.save(category);
            return true;
        } else if (category === undefined || newParent === undefined) {
            throw new Error('Parent category not found');
        }

        let parentId: number | null = newParent.parentId ?? null;
        while (parentId !== null) {
            if (parentId === category.id) {
                return false;
            }
            const parent = categories.find((c) => c.id === parentId);
            parentId = parent?.parentId ?? null;
        }

        category.parentId = newParentId;
        await this.categoryDao.save(category);
        return true;
    }
}
