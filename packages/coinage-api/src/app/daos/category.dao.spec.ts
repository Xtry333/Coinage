import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CategoryDao } from './category.dao';

describe('CategoryDao', () => {
    let dao: CategoryDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryDao,
                {
                    provide: 'CategoryRepository',
                    useValue: { findOne: jest.fn(), find: jest.fn(), findBy: jest.fn() },
                },
                {
                    provide: DataSource,
                    useValue: { getRepository: jest.fn() },
                },
            ],
        }).compile();

        dao = module.get(CategoryDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
