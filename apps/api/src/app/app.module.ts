import { AccountDao } from './daos/account.dao';
import { AccountsController } from './controllers/accounts.controller';
import { CategoriesController } from './controllers/categories.controller';
import { CategoryCascadeService } from './services/category-cascades.service';
import { CategoryDao } from './daos/category.dao';
import { ContractorController } from './controllers/contractors.controller';
import { ContractorDao } from './daos/contractor.dao';
import { DashboardComponent } from './controllers/dashboard.controller';
import { DateParserService } from './services/date-parser.service';
import { EtherealTransferService } from './services/ethereal-transfer.service';
import { EventsGateway } from './events/events.gateway';
import { Module } from '@nestjs/common';
import { ReceiptDao } from './daos/receipt.dao';
import { ReceiptsController } from './controllers/receipts.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { TransferDao } from './daos/transfer.dao';
import { TransfersController } from './controllers/transfers.controller';
import { TransfersService } from './services/transfers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import entities from './entities/_index';
import ormconfig from '../../ormconfig';

const controllers = [AccountsController, CategoriesController, ContractorController, DashboardComponent, ReceiptsController, TransfersController];
const services = [TransfersService, DateParserService, CategoryCascadeService, EtherealTransferService];
const daos = [AccountDao, CategoryDao, ContractorDao, ReceiptDao, TransferDao];

@Module({
    imports: [TypeOrmModule.forRoot(ormconfig), ScheduleModule.forRoot(), TypeOrmModule.forFeature(entities)],
    controllers: controllers,
    providers: [...services, ...daos, EventsGateway],
})
export class AppModule {}
