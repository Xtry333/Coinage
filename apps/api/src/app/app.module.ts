import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import ormconfig from '../../ormconfig';
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
import { EventsGateway } from './events/events.gateway';
import { CategoryCascadeService } from './services/category-cascades.service';
import { DateParserService } from './services/date-parser.service';
import { TransfersService } from './services/transfers.service';

const controllers = [AccountsController, CategoriesController, ContractorController, DashboardComponent, ReceiptsController, TransfersController];
const services = [TransfersService, DateParserService, CategoryCascadeService];
const daos = [AccountDao, CategoryDao, ContractorDao, ReceiptDao, TransferDao];

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig)],
    controllers: controllers,
    providers: [...services, ...daos, EventsGateway],
})
export class AppModule {}
