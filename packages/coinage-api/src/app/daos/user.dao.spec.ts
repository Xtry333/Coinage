import { Test, TestingModule } from '@nestjs/testing';
import { UserDao } from './user.dao';

describe('UserDao', () => {
    let dao: UserDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserDao],
        }).compile();

        dao = module.get(UserDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
