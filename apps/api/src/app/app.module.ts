import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiPathsModule } from '@coinage-app/router';
import ormconfig from 'apps/api/ormconfig';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransfersController } from './controllers/transfers.controller';
import { TransferService } from './services/transfer.service';
import { CategoriesController } from './controllers/categories.controller';
import { CategoryService } from './services/category.service';
import { ContractorService } from './services/contractor.service';
import { ContractorController } from './controllers/contractors.controller';

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig)],
    controllers: [AppController, TransfersController, CategoriesController, ContractorController],
    providers: [AppService, TransferService, CategoryService, ContractorService, ApiPathsModule],
})
export class AppModule {}
