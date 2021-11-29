import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'reflect-metadata';
import ormconfig from '../../ormconfig';

import { AppService } from './app.service';
import { TransfersController } from './controllers/transfers.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ContractorController } from './controllers/contractors.controller';
import { CategoryDao } from './daos/category.dao';
import { ContractorDao } from './daos/contractor.dao';
import { TransferDao } from './daos/transfer.dao';
import { AccountDao } from './daos/account.dao';
import { AccountsController } from './controllers/accounts.controller';
import { DashboardComponent } from './controllers/dashboard.controller';
import { ReceiptDao } from './daos/receipt.dao';
import { DateParserService } from './services/date-parser.service';
import { ReceiptsController } from './controllers/receipts.controller';

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig)],
    controllers: [TransfersController, ReceiptsController, CategoriesController, ContractorController, AccountsController, DashboardComponent],
    providers: [AppService, TransferDao, CategoryDao, ContractorDao, AccountDao, ReceiptDao, DateParserService],
})
export class AppModule {}
