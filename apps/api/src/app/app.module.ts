import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ormconfig from '../../ormconfig';

import { AppService } from './app.service';
import { TransfersController } from './controllers/transfers.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ContractorController } from './controllers/contractors.controller';
import { CategoryDao } from './daos/category.dao';
import { ContractorDao } from './daos/contractor.dao';
import { TransferDao } from './daos/transfer.dao';
import { AccountDao } from './daos/account.dao';

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig)],
    controllers: [TransfersController, CategoriesController, ContractorController],
    providers: [AppService, TransferDao, CategoryDao, ContractorDao, AccountDao],
})
export class AppModule {}
