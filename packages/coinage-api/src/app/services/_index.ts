import { AccountBalanceService } from './account-balance.service';
import { AccountsService } from './accounts/accounts.service';
import { AuthGuard } from './auth.guard';
import { CategoryCascadeService } from './category-cascades.service';
import { DatabaseSourceService } from './database-source.service';
import { DateParserService } from './date-parser.service';
import { EtherealTransferService } from './ethereal-transfer.service';
import { ItemsService } from './items.service';
import { TemplateNameMapperService } from './template-name-mapper.service';
import { TransferItemsService } from './transfer-items.service';
import { TransfersService } from './transfers.service';
import { SaveTransfersService } from './transfers/save-transfers.service';

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
    AccountsService,
    ItemsService,
];
