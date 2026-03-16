import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserDao } from './user.dao';

describe('UserDao', () => {
    let dao: UserDao;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserDao,
                {
                    provide: 'UserRepository',
                    useValue: { findOne: jest.fn(), findOneByOrFail: jest.fn() },
                },
                {
                    provide: 'ItemsWithContainersRepository',
                    useValue: { find: jest.fn() },
                },
                {
                    provide: DataSource,
                    useValue: { getRepository: jest.fn() },
                },
            ],
        }).compile();

        dao = module.get(UserDao);
    });

    it('should be created', async () => {
        expect(dao).toBeTruthy();
    });
});
