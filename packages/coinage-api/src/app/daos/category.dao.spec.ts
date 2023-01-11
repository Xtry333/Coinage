import { Test, TestingModule } from '@nestjs/testing';
import { CategoryDao } from './category.dao';

describe('CategoryDao', () => {
    let dao: CategoryDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CategoryDao],
        }).compile();

        dao = module.get(CategoryDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
