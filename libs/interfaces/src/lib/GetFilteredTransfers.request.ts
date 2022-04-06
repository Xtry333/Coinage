import { PagedRequest } from '../partial/Paged.request';
import { Range } from './interfaces';
import { TransferTypeEnum } from '../model/TransferDetails.dto.response';

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
