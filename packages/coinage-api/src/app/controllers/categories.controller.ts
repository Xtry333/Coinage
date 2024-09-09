import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { BaseResponseDTO, CategoryDTO, CreateEditCategoryDTO, TotalInMonthByCategory } from '@coinage-app/interfaces';

import { CategoryDao as CategoryDao } from '../daos/category.dao';
import { Category } from '../entities/Category.entity';
import { AuthGuard } from '../services/auth.guard';
import { CategoryCascadeService } from '../services/category-cascades.service';

@UseGuards(AuthGuard)
@Controller('category')
export class CategoriesController {
    public constructor(private readonly categoryDao: CategoryDao, private readonly categoryCascadeService: CategoryCascadeService) {}

    @Post('save')
    public async saveCategory(@Body() category: CreateEditCategoryDTO): Promise<BaseResponseDTO> {
        let entity: Category;

        if (category.id) {
            const result = await this.categoryDao.getById(category.id);
            if (result) {
                entity = result;
            } else {
                throw new Error('Id not found.');
            }
        } else {
            entity = new Category();
        }

        entity.name = category.name;
        if (category.description) entity.description = category.description;

        let inserted = await this.categoryDao.save(entity);

        if (category.parentId !== undefined) {
            if (await this.categoryCascadeService.canSetCategoryParentById(inserted.id, category.parentId)) {
                entity.parentId = category.parentId;
                inserted = await this.categoryDao.save(entity);
            }
        }

        return { insertedId: inserted.id };
    }

    @Get('list')
    public async getCategoryList(): Promise<CategoryDTO[]> {
        const categories = await this.categoryDao.getAll();
        return categories
            .map((c) => {
                return {
                    id: c.id,
                    name: c.name,
                    parentId: c.parentId ?? null,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    @Get('/tree')
    public async getCategoryTree(): Promise<CategoryDTO[]> {
        const categories = await this.categoryDao.getAll();
        const roots = categories.filter((c) => c.parentId == null).map((c) => this.mapToTree(c, categories));
        return roots;
    }

    private mapToTree(c: Category, allCategories: Category[]): CategoryDTO {
        return {
            id: c.id,
            name: c.name,
            children: allCategories.filter((child) => child.parentId == c.id).map((cat) => this.mapToTree(cat, allCategories)),
            description: c.description,
            parentId: c.parentId,
            systemTag: c.tag,
        };
    }

    @Get('/totalPerCategory/:year/:month/:day?')
    public async getTotalPerCategory(@Param('year') year: string, @Param('month') month: string, @Param('day') day: string): Promise<TotalInMonthByCategory[]> {
        const yearNum = parseInt(year),
            monthNum = parseInt(month),
            dayNum = parseInt(day);
        if (yearNum) {
            return await this.categoryDao.getTotalByCategoryMonth(yearNum, monthNum ? monthNum : undefined, dayNum ? dayNum : undefined);
        } else {
            return [];
        }
    }

    public async traverse(categories: Category[]): Promise<void> {
        for (const category of categories) {
            await this.traverse((await category.children) ?? []);
        }
    }
}
