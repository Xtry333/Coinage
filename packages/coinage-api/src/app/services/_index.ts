import { AccountBalanceService } from './account-balance.service';
import { CategoryCascadeService } from './category-cascades.service';
import { DateParserService } from './date-parser.service';
import { EtherealTransferService } from './ethereal-transfer.service';
import { SaveTransfersService } from './transfers/save-transfers.service';
import { TransfersService } from './transfers.service';
import { TemplateNameMapperService } from './template-name-mapper.service';
import { AuthGuard } from './auth.guard';
import { TransferItemsService } from './transfer-items.service';
import { DatabaseSourceService } from './database-source.service';

export default [
    DatabaseSourceService,
    AuthGuard,
    AccountBalanceService,
    TransfersService,
    SaveTransfersService,
    DateParserService,
    CategoryCascadeService,
    EtherealTransferService,
    TemplateNameMapperService,
    TransferItemsService,
];
