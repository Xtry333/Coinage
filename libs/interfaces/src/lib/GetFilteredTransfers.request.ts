import { Range, TransferTypeEnum } from './interfaces';

import { PagedRequest } from '../partial/Paged.request';

export class GetFilteredTransfersRequest extends PagedRequest {
    transferIds?: number[];
    description?: string;
    amount?: Range<number>;
    contractorIds?: number[];
    categoryIds?: number[];
    accountIds?: number[];
    type?: TransferTypeEnum;
    date?: Range<Date>;
    showPlanned?: boolean;
}
