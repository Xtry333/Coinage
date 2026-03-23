import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ItemDao } from '../daos/item.dao';
import { ItemsWithContainersDao } from '../daos/itemsWithContainers.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { UserDao } from '../daos/user.dao';
import { Category } from '../entities/Category.entity';
import { Container } from '../entities/Container.entity';
import { Contractor } from '../entities/Contractor.entity';
import { Item } from '../entities/Item.entity';
import { Receipt } from '../entities/Receipt.entity';
import { User } from '../entities/User.entity';
import { ItemsWithContainers } from '../entities/views/ItemsWithContainers.view';
import { EventsGateway } from '../events/events.gateway';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';
import { MatchExtractedReceiptHandler } from './commands/handlers/match-extracted-receipt.handler';
import { ProcessPendingReceiptHandler } from './commands/handlers/process-pending-receipt.handler';
import { ReceiptErrorHandler } from './events/handlers/receipt-error.handler';
import { ReceiptProcessedHandler } from './events/handlers/receipt-processed.handler';
import { ReceiptQueuedHandler } from './events/handlers/receipt-queued.handler';
import { ReceiptProcessingScheduler } from './receipt-processing.scheduler';
import { OllamaService } from './services/ollama.service';
import { ReceiptNormalizationService } from './services/receipt-normalization.service';

const CommandHandlers = [ProcessPendingReceiptHandler, MatchExtractedReceiptHandler];
const EventHandlers = [ReceiptQueuedHandler, ReceiptProcessedHandler, ReceiptErrorHandler];

@Module({
    imports: [CqrsModule, TypeOrmModule.forFeature([Receipt, Category, Contractor, Item, Container, User, ItemsWithContainers])],
    providers: [
        OllamaService,
        ReceiptNormalizationService,
        ReceiptProcessingScheduler,
        ReceiptDao,
        CategoryDao,
        ContractorDao,
        ItemDao,
        ItemsWithContainersDao,
        UserDao,
        TemplateNameMapperService,
        EventsGateway,
        ...CommandHandlers,
        ...EventHandlers,
    ],
    exports: [CqrsModule, OllamaService],
})
export class ReceiptProcessingModule {}
