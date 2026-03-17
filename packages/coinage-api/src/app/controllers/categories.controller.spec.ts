import { Test, TestingModule } from '@nestjs/testing';

import { PartialProvider } from '../../test/partial-provider';
import { AuthService } from '../auth/auth.service';
import { CategoryDao } from '../daos/category.dao';
import { UserDao } from '../daos/user.dao';
import { Category } from '../entities/Category.entity';
import { AuthGuard } from '../services/auth.guard';
import { CategoryCascadeService } from '../services/category-cascades.service';
import { CategoriesController } from './categories.controller';

function makeCategory(id: number, name: string, parentId: number | null = null, tag?: string): Category {
    const c = new Category();
    c.id = id;
    c.name = name;
    c.parentId = parentId;
    c.tag = tag as any;
    c.description = undefined as any;
    return c;
}

describe('CategoriesController', () => {
    let controller: CategoriesController;
    let categoryDao: any;
    let categoryCascadeService: any;

    beforeEach(async () => {
        categoryDao = {
            getAll: jest.fn(),
            getById: jest.fn(),
            save: jest.fn(),
            getTotalByCategoryMonth: jest.fn(),
        };

        categoryCascadeService = {
            canSetCategoryParentById: jest.fn(),
        };

        const categoryDaoProvider: PartialProvider<CategoryDao> = {
            provide: CategoryDao,
            useValue: categoryDao,
        };

        const categoryCascadeServiceProvider: PartialProvider<CategoryCascadeService> = {
            provide: CategoryCascadeService,
            useValue: categoryCascadeService,
        };

        const authGuardProvider: PartialProvider<AuthGuard> = {
            provide: AuthGuard,
            useValue: { canActivate: jest.fn(() => Promise.resolve(true)) },
        };

        const userDaoProvider: PartialProvider<UserDao> = {
            provide: UserDao,
            useValue: {},
        };

        const authServiceProvider: PartialProvider<AuthService> = {
            provide: AuthService,
            useValue: {},
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [categoryDaoProvider, categoryCascadeServiceProvider, authGuardProvider, userDaoProvider, authServiceProvider],
        }).compile();

        controller = module.get<CategoriesController>(CategoriesController);
    });

    describe('getCategoryList', () => {
        it('returns all categories mapped to DTOs sorted alphabetically by name', async () => {
            const categories = [makeCategory(1, 'Zebra'), makeCategory(2, 'Apple'), makeCategory(3, 'Mango', 1)];
            categoryDao.getAll.mockResolvedValue(categories);

            const result = await controller.getCategoryList();

            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('Apple');
            expect(result[1].name).toBe('Mango');
            expect(result[2].name).toBe('Zebra');
        });

        it('maps parentId as null when category has no parent', async () => {
            categoryDao.getAll.mockResolvedValue([makeCategory(1, 'Root', null)]);

            const result = await controller.getCategoryList();

            expect(result[0].parentId).toBeNull();
        });

        it('maps parentId correctly when category has a parent', async () => {
            categoryDao.getAll.mockResolvedValue([makeCategory(5, 'Child', 2)]);

            const result = await controller.getCategoryList();

            expect(result[0].parentId).toBe(2);
        });

        it('returns empty array when no categories exist', async () => {
            categoryDao.getAll.mockResolvedValue([]);

            const result = await controller.getCategoryList();

            expect(result).toEqual([]);
        });
    });

    describe('getCategoryTree', () => {
        it('returns only root categories (parentId == null) at the top level', async () => {
            const categories = [makeCategory(1, 'Root1', null), makeCategory(2, 'Root2', null), makeCategory(3, 'Child', 1)];
            categoryDao.getAll.mockResolvedValue(categories);

            const result = await controller.getCategoryTree();

            expect(result).toHaveLength(2);
            expect(result.map((r) => r.name)).toEqual(expect.arrayContaining(['Root1', 'Root2']));
        });

        it('nests children under their parent category', async () => {
            const categories = [makeCategory(1, 'Parent', null), makeCategory(2, 'Child', 1), makeCategory(3, 'Grandchild', 2)];
            categoryDao.getAll.mockResolvedValue(categories);

            const result = await controller.getCategoryTree();

            expect(result).toHaveLength(1);
            expect(result[0].children).toHaveLength(1);
            expect(result[0].children![0].name).toBe('Child');
            expect(result[0].children![0].children).toHaveLength(1);
            expect(result[0].children![0].children![0].name).toBe('Grandchild');
        });

        it('returns empty array when no categories exist', async () => {
            categoryDao.getAll.mockResolvedValue([]);

            const result = await controller.getCategoryTree();

            expect(result).toEqual([]);
        });
    });

    describe('saveCategory', () => {
        it('creates a new category when no id is provided', async () => {
            const saved = makeCategory(10, 'New Category');
            categoryDao.save.mockResolvedValue(saved);

            const result = await controller.saveCategory({ name: 'New Category' } as any);

            expect(categoryDao.getById).not.toHaveBeenCalled();
            expect(categoryDao.save).toHaveBeenCalled();
            expect(result.insertedId).toBe(10);
        });

        it('updates an existing category when id is provided', async () => {
            const existing = makeCategory(5, 'Old Name');
            const saved = makeCategory(5, 'New Name');
            categoryDao.getById.mockResolvedValue(existing);
            categoryDao.save.mockResolvedValue(saved);

            const result = await controller.saveCategory({ id: 5, name: 'New Name' } as any);

            expect(categoryDao.getById).toHaveBeenCalledWith(5);
            expect(result.insertedId).toBe(5);
        });

        it('throws an error when id is provided but not found', async () => {
            categoryDao.getById.mockResolvedValue(null as any);

            await expect(controller.saveCategory({ id: 99, name: 'Missing' } as any)).rejects.toThrow('Id not found.');
        });

        it('sets parentId when canSetCategoryParentById returns true', async () => {
            const saved = makeCategory(10, 'Category');
            const savedWithParent = makeCategory(10, 'Category', 2);
            categoryDao.save.mockResolvedValueOnce(saved).mockResolvedValueOnce(savedWithParent);
            categoryCascadeService.canSetCategoryParentById.mockResolvedValue(true);

            const result = await controller.saveCategory({ name: 'Category', parentId: 2 } as any);

            expect(categoryCascadeService.canSetCategoryParentById).toHaveBeenCalledWith(10, 2);
            expect(result.insertedId).toBe(10);
        });

        it('does not set parentId when canSetCategoryParentById returns false', async () => {
            const saved = makeCategory(10, 'Category');
            categoryDao.save.mockResolvedValue(saved);
            categoryCascadeService.canSetCategoryParentById.mockResolvedValue(false);

            const result = await controller.saveCategory({ name: 'Category', parentId: 2 } as any);

            expect(categoryDao.save).toHaveBeenCalledTimes(1);
            expect(result.insertedId).toBe(10);
        });
    });

    describe('getTotalPerCategory', () => {
        it('delegates to categoryDao.getTotalByCategoryMonth with parsed year and month', async () => {
            const totals = [{ categoryId: 1, total: 500 }] as any;
            categoryDao.getTotalByCategoryMonth.mockResolvedValue(totals);

            const result = await controller.getTotalPerCategory('2024', '3', undefined as any);

            expect(categoryDao.getTotalByCategoryMonth).toHaveBeenCalledWith(2024, 3, undefined);
            expect(result).toBe(totals);
        });

        it('returns empty array when year is not a valid number', async () => {
            const result = await controller.getTotalPerCategory('invalid', '3', undefined as any);

            expect(categoryDao.getTotalByCategoryMonth).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('passes undefined for month when month param is not a number', async () => {
            const totals: any[] = [];
            categoryDao.getTotalByCategoryMonth.mockResolvedValue(totals);

            await controller.getTotalPerCategory('2024', 'abc', undefined as any);

            expect(categoryDao.getTotalByCategoryMonth).toHaveBeenCalledWith(2024, undefined, undefined);
        });

        it('passes day param when it is a valid number', async () => {
            categoryDao.getTotalByCategoryMonth.mockResolvedValue([]);

            await controller.getTotalPerCategory('2024', '3', '15');

            expect(categoryDao.getTotalByCategoryMonth).toHaveBeenCalledWith(2024, 3, 15);
        });
    });
});
