import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ormconfig from '../../ormconfig';

import { AppService } from './app.service';
import { TransfersController } from './controllers/transfers.controller';
import { TransferService } from './services/transfer.service';
import { CategoriesController } from './controllers/categories.controller';
import { CategoryService } from './services/category.service';
import { ContractorService } from './services/contractor.service';
import { ContractorController } from './controllers/contractors.controller';

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig)],
    controllers: [TransfersController, CategoriesController, ContractorController],
    providers: [AppService, TransferService, CategoryService, ContractorService],
})
export class AppModule {}
