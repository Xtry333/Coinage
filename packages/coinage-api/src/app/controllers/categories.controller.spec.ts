import { Test, TestingModule } from '@nestjs/testing';

import { CategoriesController } from './categories.controller';
import { AppService } from '../app.service';

describe('Transfer Controller', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [AppService],
        }).compile();
    });

    describe('getData', () => {
        it('should return "Welcome to api!"', () => {
            const appController = app.get<CategoriesController>(CategoriesController);
            expect(appController.getCategoryTree()).toEqual([]);
        });
    });
});
