import { TestBed } from '@angular/core/testing';

import { CategoryDao } from './category.dao';

describe('CategoryDao', () => {
    let dao: CategoryDao;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        dao = TestBed.inject(CategoryDao);
    });

    it('should be created', () => {
        expect(dao).toBeTruthy();
    });

    it('should return by id', async () => {
        const category = await dao.getById(1);
        expect(category).toBeDefined();
    });
});
