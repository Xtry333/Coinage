import { AccountBalanceService } from './account-balance.service';
import { CategoryCascadeService } from './category-cascades.service';
import { DateParserService } from './date-parser.service';
import { EtherealTransferService } from './ethereal-transfer.service';
import { SaveTransfersService } from './transfers/save-transfers.service';
import { TransfersService } from './transfers.service';
import { TemplateNameMapperService } from './template-name-mapper.service';

export default [
    AccountBalanceService,
    TransfersService,
    SaveTransfersService,
    DateParserService,
    CategoryCascadeService,
    EtherealTransferService,
    TemplateNameMapperService,
];
