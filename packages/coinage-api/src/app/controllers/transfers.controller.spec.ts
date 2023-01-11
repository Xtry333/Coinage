import { Test, TestingModule } from '@nestjs/testing';

import { AppService } from '../app.service';
import { TransfersController } from './transfer.controller';

describe('Categories Controller', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [TransfersController],
            providers: [AppService],
        }).compile();
    });

    describe('getData', () => {
        it('should return "Welcome to api!"', () => {
            const appController = app.get<TransfersController>(TransfersController);
            expect(appController.getLastTotalOutcomesPerMonth()).toEqual({
                message: 'Welcome to api!',
            });
        });
    });
});
