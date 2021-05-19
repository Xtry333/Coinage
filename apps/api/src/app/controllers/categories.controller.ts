import { Controller, Get } from '@nestjs/common';

import { CategoryService } from '../services/category.service';

@Controller()
export class CategoriesController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('/categoryTree')
    async getCategoryTree(): Promise<[]> {
        const categories = await this.categoryService.getAll();
        return [];
    }
}
