import { CategoryDTO, TotalInMonthByCategory } from '@coinage-app/interfaces';
import { Controller, Get, Param } from '@nestjs/common';
import { Category } from '../entity/Category.entity';

import { CategoryService } from '../services/category.service';

@Controller('category')
export class CategoriesController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('/list')
    async getCategoryList(): Promise<CategoryDTO[]> {
        const categories = await this.categoryService.getAll();
        return categories
            .map((c) => {
                return {
                    id: c.id,
                    name: c.name,
                    parentId: c.parentId,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    @Get('/tree')
    async getCategoryTree(): Promise<CategoryDTO[]> {
        const categories = await this.categoryService.getAll();
        const roots = categories.filter((c) => c.parentId == null).map((c) => this.mapToTree(c, categories));
        return roots;
    }

    private mapToTree(c: Category, allCategories: Category[]): CategoryDTO {
        return {
            id: c.id,
            name: c.name,
            children: allCategories.filter((child) => child.parentId == c.id).map((cat) => this.mapToTree(cat, allCategories)),
            parentId: c.parentId,
        };
    }

    @Get('/totalPerCategory/:year/:month')
    async getTotalPerCategory(@Param('year') year: string, @Param('month') month: string): Promise<TotalInMonthByCategory[]> {
        const yearNum = parseInt(year),
            monthNum = parseInt(month);
        if (yearNum) {
            return await this.categoryService.getTotalByCategoryMonth(yearNum, monthNum ? monthNum : undefined);
        } else {
            return [];
        }
    }

    async traverse(categories: Category[]): Promise<void> {
        for (const category of categories) {
            await this.traverse((await category.children) ?? []);
        }
    }
}
