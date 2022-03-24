import { Test, TestingModule } from '@nestjs/testing';

import { Category } from '../entities/Category.entity';
import { CategoryCascadeService } from './category-cascades.service';
import { CategoryDao } from '../daos/category.dao';
import { PartialProvider } from '../test/partial-provider';
import { Provider } from '@nestjs/common';

describe('CategoryCascadeService', () => {
    let service: CategoryCascadeService;

    const categoryDaoProvider: PartialProvider<CategoryDao> = {
        provide: CategoryDao,
        useValue: {
            getAll: jest.fn().mockResolvedValue(createCategoryTree()),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CategoryCascadeService, categoryDaoProvider],
        }).compile();

        service = module.get<CategoryCascadeService>(CategoryCascadeService);
    });

    it('should be created', async () => {
        expect(service).toBeTruthy();
    });

    describe('canSetCategoryParentById', () => {
        it('should throw an error when category does not exist', () => {
            expect(service.canSetCategoryParentById(999, null)).rejects.toThrowError();
        });

        it('should allow setting parent to null', () => {
            expect(service.canSetCategoryParentById(2, null)).resolves.toBeTruthy();
        });

        it('should allow setting correct parent for category in simple case', () => {
            expect(service.canSetCategoryParentById(7, 5)).resolves.toBeTruthy();
        });

        it('should allow setting correct parent for category in advanced case', () => {
            expect(service.canSetCategoryParentById(4, 2)).resolves.toBeTruthy();
        });

        it('should not allow setting parent to itself', () => {
            expect(service.canSetCategoryParentById(1, 1)).resolves.toBeFalsy();
        });

        it('should not allow setting circular parent to category in simple case', () => {
            expect(service.canSetCategoryParentById(1, 2)).resolves.toBeFalsy();
        });

        it('should not allow setting circular parent to category in advanced case', () => {
            expect(service.canSetCategoryParentById(4, 3)).resolves.toBeTruthy();
            expect(service.canSetCategoryParentById(3, 7)).resolves.toBeFalsy();
        });
    });

    function createCategoryTree(): Category[] {
        let index = 1;
        const categoryA = createCategory(index++, null);
        const categoryA1 = createCategory(index++, categoryA.id);
        const categoryA2 = createCategory(index++, categoryA.id);
        const categoryB = createCategory(index++, null);
        const categoryB1 = createCategory(index++, categoryB.id);
        const categoryB2 = createCategory(index++, categoryB.id);
        const categoryB21 = createCategory(index++, categoryB2.id);
        return [categoryA, categoryA1, categoryA2, categoryB, categoryB1, categoryB2, categoryB21];
    }

    function createCategory(id: number, parentId: number | null): Category {
        const c = new Category();
        c.id = id;
        c.parentId = parentId;
        return c;
    }
});
