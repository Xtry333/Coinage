import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import ormconfig from '../../ormconfig';
import { AppService } from './app.service';
import { AccountsController } from './controllers/accounts.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ContractorController } from './controllers/contractors.controller';
import { DashboardComponent } from './controllers/dashboard.controller';
import { ReceiptsController } from './controllers/receipts.controller';
import { TransfersController } from './controllers/transfers.controller';
import { AccountDao } from './daos/account.dao';
import { CategoryDao } from './daos/category.dao';
import { ContractorDao } from './daos/contractor.dao';
import { ReceiptDao } from './daos/receipt.dao';
import { TransferDao } from './daos/transfer.dao';
import { DateParserService } from './services/date-parser.service';

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig)],
    controllers: [TransfersController, ReceiptsController, CategoriesController, ContractorController, AccountsController, DashboardComponent],
    providers: [AppService, TransferDao, CategoryDao, ContractorDao, AccountDao, ReceiptDao, DateParserService],
})
export class AppModule {}
