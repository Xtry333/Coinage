import { TestBed } from '@angular/core/testing';

import { UserDao } from './user.dao';

describe('UserDao', () => {
    let dao: UserDao;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        dao = TestBed.inject(UserDao);
    });

    it('should be created', () => {
        expect(dao).toBeTruthy();
    });

    it('should return by id', async () => {
        const user = await dao.getById(1);
        expect(user).toBeDefined();
    });
});
