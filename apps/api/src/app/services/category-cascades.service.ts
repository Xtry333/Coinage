import { Category } from '../entities/Category.entity';
import { CategoryDao } from '../daos/category.dao';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoryCascadeService {
    constructor(private readonly categoryDao: CategoryDao) {}

    public async canSetCategoryParentById(categoryId: number, newParentId: number | null): Promise<boolean> {
        const categories = await this.categoryDao.getAll();

        const category = categories.find((c) => c.id === categoryId);
        const newParent = categories.find((c) => c.id === newParentId);

        if (category !== undefined && newParentId === null) {
            category.parentId = newParentId;
            return true;
        } else if (category === undefined || newParent === undefined) {
            throw new Error('Category not found');
        }

        let parentCategory: Category | undefined = newParent;
        while (parentCategory !== undefined && parentCategory?.id !== category.id) {
            if (parentCategory?.parentId === null) {
                category.parentId = newParentId;
                return true;
            }
            parentCategory = categories.find((c) => c.id === parentCategory?.parentId);
        }

        return false;
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

        let parentCategory: Category | undefined = newParent;
        while (parentCategory !== undefined && parentCategory?.id !== category.id) {
            if (parentCategory?.parentId === null) {
                category.parentId = newParentId;
                await this.categoryDao.save(category);
                return true;
            }
            parentCategory = categories.find((c) => c.id === parentCategory?.parentId);
        }

        return false;
    }
}
