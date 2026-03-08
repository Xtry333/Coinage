import { Test, TestingModule } from '@nestjs/testing';

import { UserDao } from '../../daos/user.dao';
import { PartialProvider } from '../../../test/partial-provider';
import { UserController } from './user.controller';

describe('UserController', () => {
    let controller: UserController;
    let userDao: jest.Mocked<Partial<UserDao>>;

    beforeEach(async () => {
        userDao = {
            getById: jest.fn(),
            getCurrentDbDate: jest.fn(),
        };

        const userDaoProvider: PartialProvider<UserDao> = {
            provide: UserDao,
            useValue: userDao,
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [userDaoProvider],
        }).compile();

        controller = module.get<UserController>(UserController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getUserData', () => {
        it('returns userId and username from the user entity', async () => {
            const mockUser = { id: 42, name: 'Alice' } as any;
            userDao.getById!.mockResolvedValue(mockUser);

            const result = await controller.getUserData(42);

            expect(userDao.getById).toHaveBeenCalledWith(42);
            expect(result).toEqual({ userId: 42, username: 'Alice' });
        });

        it('returns the userId as passed in the param', async () => {
            const mockUser = { id: 7, name: 'Bob' } as any;
            userDao.getById!.mockResolvedValue(mockUser);

            const result = await controller.getUserData(7);

            expect(result.userId).toBe(7);
        });
    });

    describe('getServerDate', () => {
        it('returns the date from userDao.getCurrentDbDate', async () => {
            const mockDate = new Date('2024-03-15T12:00:00Z');
            userDao.getCurrentDbDate!.mockResolvedValue(mockDate);

            const result = await controller.getServerDate();

            expect(userDao.getCurrentDbDate).toHaveBeenCalled();
            expect(result).toBe(mockDate);
        });
    });
});
